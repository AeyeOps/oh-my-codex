/**
 * Reply Listener Daemon
 *
 * Background daemon that polls Discord and Telegram for replies to notification messages,
 * sanitizes input, verifies the target pane, and injects reply text via sendToPane().
 *
 * Security considerations:
 * - State/PID/log files use restrictive permissions (0600)
 * - Bot tokens stored in state file, NOT in environment variables
 * - Two-layer input sanitization (sanitizeReplyInput + newline stripping in buildSendPaneArgvs)
 * - Pane verification via analyzePaneContent before every injection
 * - Authorization: only configured user IDs (Discord) / chat ID (Telegram) can inject
 * - Rate limiting to prevent spam/abuse
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, chmodSync, statSync, appendFileSync, renameSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { spawn } from 'child_process';
import { request as httpsRequest } from 'https';
import { capturePaneContent, analyzePaneContent, sendToPane, isTmuxAvailable, } from './tmux-detector.js';
import { lookupByMessageId, removeMessagesByPane, pruneStale, } from './session-registry.js';
import { NO_TRACKED_SESSION_MESSAGE, buildDiscordSessionStatusReply, isDiscordStatusCommand, } from './session-status.js';
import { parseMentionAllowedMentions } from './config.js';
import { parseTmuxTail } from './formatter.js';
import { spawnPlatformCommandSync } from '../utils/platform-command.js';
const __filename = fileURLToPath(import.meta.url);
const SECURE_FILE_MODE = 0o600;
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
const DAEMON_ENV_ALLOWLIST = [
    'PATH', 'HOME', 'USERPROFILE',
    'USER', 'USERNAME', 'LOGNAME',
    'LANG', 'LC_ALL', 'LC_CTYPE',
    'TERM', 'TMUX', 'TMUX_PANE',
    'TMPDIR', 'TMP', 'TEMP',
    'XDG_RUNTIME_DIR', 'XDG_DATA_HOME', 'XDG_CONFIG_HOME',
    'SHELL',
    'NODE_ENV',
    'HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'NO_PROXY', 'no_proxy',
    'SystemRoot', 'SYSTEMROOT', 'windir', 'COMSPEC',
];
const DEFAULT_STATE_DIR = join(homedir(), '.omx', 'state');
const PID_FILE_PATH = join(DEFAULT_STATE_DIR, 'reply-listener.pid');
const STATE_FILE_PATH = join(DEFAULT_STATE_DIR, 'reply-listener-state.json');
const LOG_FILE_PATH = join(DEFAULT_STATE_DIR, 'reply-listener.log');
const MIN_REPLY_POLL_INTERVAL_MS = 500;
const MAX_REPLY_POLL_INTERVAL_MS = 60_000;
const DEFAULT_REPLY_POLL_INTERVAL_MS = 3_000;
const MIN_REPLY_RATE_LIMIT_PER_MINUTE = 1;
const DEFAULT_REPLY_RATE_LIMIT_PER_MINUTE = 10;
const MIN_REPLY_MAX_MESSAGE_LENGTH = 1;
const MAX_REPLY_MAX_MESSAGE_LENGTH = 4_000;
const DEFAULT_REPLY_MAX_MESSAGE_LENGTH = 500;
const REPLY_ACK_CAPTURE_LINES = 200;
const REPLY_ACK_SUMMARY_MAX_CHARS = 700;
const REPLY_ACK_PREFIX = 'Injected into Codex CLI session.';
const REPLY_ACK_FALLBACK = 'Recent output summary unavailable.';
function createMinimalDaemonEnv() {
    const env = {};
    for (const key of DAEMON_ENV_ALLOWLIST) {
        if (process.env[key] !== undefined) {
            env[key] = process.env[key];
        }
    }
    return env;
}
function ensureStateDir() {
    if (!existsSync(DEFAULT_STATE_DIR)) {
        mkdirSync(DEFAULT_STATE_DIR, { recursive: true, mode: 0o700 });
    }
}
function writeSecureFile(filePath, content) {
    ensureStateDir();
    writeFileSync(filePath, content, { mode: SECURE_FILE_MODE });
    try {
        chmodSync(filePath, SECURE_FILE_MODE);
    }
    catch {
        // Ignore permission errors
    }
}
function rotateLogIfNeeded(logPath) {
    try {
        if (!existsSync(logPath))
            return;
        const stats = statSync(logPath);
        if (stats.size > MAX_LOG_SIZE_BYTES) {
            const backupPath = `${logPath}.old`;
            if (existsSync(backupPath)) {
                unlinkSync(backupPath);
            }
            renameSync(logPath, backupPath);
        }
    }
    catch {
        // Ignore rotation errors
    }
}
function log(message) {
    try {
        ensureStateDir();
        rotateLogIfNeeded(LOG_FILE_PATH);
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] ${message}\n`;
        appendFileSync(LOG_FILE_PATH, logLine, { mode: SECURE_FILE_MODE });
    }
    catch {
        // Ignore log write errors
    }
}
function normalizeInteger(value, fallback, min, max) {
    const numeric = typeof value === 'number'
        ? Math.trunc(value)
        : (typeof value === 'string' && value.trim()
            ? Number.parseInt(value, 10)
            : Number.NaN);
    if (!Number.isFinite(numeric))
        return fallback;
    if (numeric < min)
        return min;
    if (max !== undefined && numeric > max)
        return max;
    return numeric;
}
export function normalizeReplyListenerConfig(config) {
    const discordEnabled = config.discordEnabled ?? !!(config.discordBotToken && config.discordChannelId);
    const telegramEnabled = config.telegramEnabled ?? !!(config.telegramBotToken && config.telegramChatId);
    return {
        ...config,
        discordEnabled,
        telegramEnabled,
        pollIntervalMs: normalizeInteger(config.pollIntervalMs, DEFAULT_REPLY_POLL_INTERVAL_MS, MIN_REPLY_POLL_INTERVAL_MS, MAX_REPLY_POLL_INTERVAL_MS),
        rateLimitPerMinute: normalizeInteger(config.rateLimitPerMinute, DEFAULT_REPLY_RATE_LIMIT_PER_MINUTE, MIN_REPLY_RATE_LIMIT_PER_MINUTE),
        maxMessageLength: normalizeInteger(config.maxMessageLength, DEFAULT_REPLY_MAX_MESSAGE_LENGTH, MIN_REPLY_MAX_MESSAGE_LENGTH, MAX_REPLY_MAX_MESSAGE_LENGTH),
        includePrefix: config.includePrefix !== false,
        authorizedDiscordUserIds: Array.isArray(config.authorizedDiscordUserIds)
            ? config.authorizedDiscordUserIds.filter((id) => typeof id === 'string' && id.trim() !== '')
            : [],
    };
}
function readDaemonState() {
    try {
        if (!existsSync(STATE_FILE_PATH))
            return null;
        const content = readFileSync(STATE_FILE_PATH, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
function writeDaemonState(state) {
    writeSecureFile(STATE_FILE_PATH, JSON.stringify(state, null, 2));
}
function readDaemonConfig() {
    try {
        const configPath = join(DEFAULT_STATE_DIR, 'reply-listener-config.json');
        if (!existsSync(configPath))
            return null;
        const content = readFileSync(configPath, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
function writeDaemonConfig(config) {
    const configPath = join(DEFAULT_STATE_DIR, 'reply-listener-config.json');
    writeSecureFile(configPath, JSON.stringify(config, null, 2));
}
function readPidFile() {
    try {
        if (!existsSync(PID_FILE_PATH))
            return null;
        const content = readFileSync(PID_FILE_PATH, 'utf-8');
        const pid = parseInt(content.trim(), 10);
        if (isNaN(pid))
            return null;
        return pid;
    }
    catch {
        return null;
    }
}
function writePidFile(pid) {
    writeSecureFile(PID_FILE_PATH, String(pid));
}
function removePidFile() {
    if (existsSync(PID_FILE_PATH)) {
        unlinkSync(PID_FILE_PATH);
    }
}
function isProcessRunning(pid) {
    try {
        process.kill(pid, 0);
        return true;
    }
    catch {
        return false;
    }
}
// Unique token embedded in the daemon's `-e` script; absent from unrelated processes.
const DAEMON_IDENTITY_MARKER = 'pollLoop';
/**
 * Verify that the process with the given PID is our reply listener daemon by
 * inspecting its command line for the daemon identity marker. Returns false if
 * the process cannot be positively identified (safe default).
 */
export function isReplyListenerProcess(pid, options = {}) {
    try {
        const platform = options.platform ?? process.platform;
        if (platform === 'linux') {
            // NUL-separated argv available without spawning a subprocess
            const cmdline = readFileSync(`/proc/${pid}/cmdline`, 'utf-8');
            return cmdline.includes(DAEMON_IDENTITY_MARKER);
        }
        if (process.platform === 'win32')
            return false;
        // macOS and other POSIX systems
        const { result } = spawnPlatformCommandSync('ps', ['-p', String(pid), '-o', 'args='], {
            encoding: 'utf-8',
            timeout: 3000,
        }, platform, options.env, options.existsImpl, options.spawnImpl);
        if (result.status !== 0 || result.error)
            return false;
        return (result.stdout ?? '').includes(DAEMON_IDENTITY_MARKER);
    }
    catch {
        return false;
    }
}
export function isDaemonRunning() {
    const pid = readPidFile();
    if (pid === null)
        return false;
    if (!isProcessRunning(pid)) {
        removePidFile();
        return false;
    }
    if (!isReplyListenerProcess(pid)) {
        removePidFile();
        return false;
    }
    return true;
}
// ============================================================================
// Input Sanitization
// ============================================================================
export function sanitizeReplyInput(text) {
    return text
        .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '') // Strip control chars (keep \n, \r, \t)
        .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '') // Strip bidi override characters
        .replace(/\r?\n/g, ' ') // Newlines -> spaces
        .replace(/\\/g, '\\\\') // Escape backslashes
        .replace(/`/g, '\\`') // Escape backticks
        .replace(/\$\(/g, '\\$(') // Escape $()
        .replace(/\$\{/g, '\\${') // Escape ${}
        .trim();
}
export class RateLimiter {
    maxPerMinute;
    timestamps = [];
    windowMs = 60 * 1000;
    constructor(maxPerMinute) {
        this.maxPerMinute = maxPerMinute;
    }
    canProceed() {
        const now = Date.now();
        this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
        if (this.timestamps.length >= this.maxPerMinute)
            return false;
        this.timestamps.push(now);
        return true;
    }
    reset() {
        this.timestamps = [];
    }
}
const SENSITIVE_KEY_PATTERN = /(["']?(?:api[_-]?key|token|secret|password|credentials?|authorization)["']?\s*[=:]\s*)(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\n]+)/gi;
const SENSITIVE_TOKEN_PATTERNS = [
    /(?:sk-(?:proj-|live-|test-)?|ghp_|gho_|ghs_|ghu_|github_pat_|xox[bpsar]-|glpat-|AKIA[A-Z0-9])\S+/g,
];
export function redactSensitiveTokens(text) {
    const withoutKeyedSecrets = text.replace(SENSITIVE_KEY_PATTERN, (match, prefix) => {
        const value = match.slice(prefix.length).trimStart();
        const quote = value.startsWith('"') ? '"' : value.startsWith('\'') ? '\'' : '';
        return `${prefix}${quote}[REDACTED]${quote}`;
    });
    return SENSITIVE_TOKEN_PATTERNS.reduce((t, re) => t.replace(re, '[REDACTED]'), withoutKeyedSecrets);
}
export function captureReplyAcknowledgementSummary(paneId, deps = {}) {
    const capturePaneContentImpl = deps.capturePaneContentImpl ?? capturePaneContent;
    const parseTmuxTailImpl = deps.parseTmuxTailImpl ?? parseTmuxTail;
    const raw = capturePaneContentImpl(paneId, REPLY_ACK_CAPTURE_LINES);
    if (!raw)
        return null;
    const summary = redactSensitiveTokens(parseTmuxTailImpl(raw)
        .replace(/\r/g, '')
        .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
        .trim());
    if (!summary)
        return null;
    if (summary.length <= REPLY_ACK_SUMMARY_MAX_CHARS)
        return summary;
    return `${summary.slice(0, REPLY_ACK_SUMMARY_MAX_CHARS - 1).trimEnd()}…`;
}
export function formatReplyAcknowledgement(summary) {
    if (!summary) {
        return `${REPLY_ACK_PREFIX}\n\n${REPLY_ACK_FALLBACK}`;
    }
    return `${REPLY_ACK_PREFIX}\n\nRecent output:\n${summary}`;
}
function injectReply(paneId, text, platform, config) {
    const content = capturePaneContent(paneId, 15);
    const analysis = analyzePaneContent(content);
    if (analysis.confidence < 0.4) {
        log(`WARN: Pane ${paneId} does not appear to be running Codex CLI (confidence: ${analysis.confidence}). Skipping injection, removing stale mapping.`);
        removeMessagesByPane(paneId);
        return false;
    }
    const prefix = config.includePrefix ? `[reply:${platform}] ` : '';
    const sanitized = sanitizeReplyInput(prefix + text);
    const truncated = sanitized.slice(0, config.maxMessageLength);
    const success = sendToPane(paneId, truncated, true);
    if (success) {
        log(`Injected reply from ${platform} into pane ${paneId}: "${truncated.slice(0, 50)}${truncated.length > 50 ? '...' : ''}"`);
    }
    else {
        log(`ERROR: Failed to inject reply into pane ${paneId}`);
    }
    return success;
}
async function postDiscordReplyMessage(config, replyToMessageId, content, deps) {
    try {
        const response = await deps.fetchImpl(`https://discord.com/api/v10/channels/${config.discordChannelId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${config.discordBotToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content,
                message_reference: { message_id: replyToMessageId },
                allowed_mentions: { parse: [] },
            }),
            signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) {
            deps.logImpl(`WARN: Failed to send Discord reply message: HTTP ${response.status}`);
        }
    }
    catch (error) {
        deps.logImpl(`WARN: Failed to send Discord reply message: ${error}`);
    }
}
// ============================================================================
// Discord Polling
// ============================================================================
let discordBackoffUntil = 0;
export function resetReplyListenerTransientState() {
    discordBackoffUntil = 0;
}
async function pollDiscord(config, state, rateLimiter) {
    return pollDiscordOnce(config, state, rateLimiter);
}
export async function pollDiscordOnce(config, state, rateLimiter, deps = {}) {
    if (config.discordEnabled === false)
        return;
    if (!config.discordBotToken || !config.discordChannelId)
        return;
    if (config.authorizedDiscordUserIds.length === 0)
        return;
    if (Date.now() < discordBackoffUntil)
        return;
    const fetchImpl = deps.fetchImpl ?? fetch;
    const injectReplyImpl = deps.injectReplyImpl ?? injectReply;
    const buildSessionStatusReplyImpl = deps.buildSessionStatusReplyImpl ?? buildDiscordSessionStatusReply;
    const captureReplyAcknowledgementSummaryImpl = deps.captureReplyAcknowledgementSummaryImpl ?? captureReplyAcknowledgementSummary;
    const lookupByMessageIdImpl = deps.lookupByMessageIdImpl ?? lookupByMessageId;
    const writeDaemonStateImpl = deps.writeDaemonStateImpl ?? writeDaemonState;
    const parseMentionAllowedMentionsImpl = deps.parseMentionAllowedMentionsImpl ?? parseMentionAllowedMentions;
    const logImpl = deps.logImpl ?? log;
    try {
        const after = state.discordLastMessageId ? `?after=${state.discordLastMessageId}&limit=10` : '?limit=10';
        const url = `https://discord.com/api/v10/channels/${config.discordChannelId}/messages${after}`;
        const response = await fetchImpl(url, {
            method: 'GET',
            headers: { 'Authorization': `Bot ${config.discordBotToken}` },
            signal: AbortSignal.timeout(10000),
        });
        const remaining = response.headers.get('x-ratelimit-remaining');
        const reset = response.headers.get('x-ratelimit-reset');
        if (remaining !== null && parseInt(remaining, 10) < 2) {
            const parsed = reset ? parseFloat(reset) : Number.NaN;
            const resetTime = Number.isFinite(parsed) ? parsed * 1000 : Date.now() + 10_000;
            discordBackoffUntil = resetTime;
            logImpl(`WARN: Discord rate limit low (remaining: ${remaining}), backing off until ${new Date(resetTime).toISOString()}`);
        }
        if (!response.ok) {
            logImpl(`Discord API error: HTTP ${response.status}`);
            return;
        }
        const messages = await response.json();
        if (!Array.isArray(messages) || messages.length === 0)
            return;
        const sorted = [...messages].reverse();
        for (const msg of sorted) {
            const isStatusCommand = isDiscordStatusCommand(msg.content ?? '');
            if (!msg.message_reference?.message_id) {
                state.discordLastMessageId = msg.id;
                writeDaemonStateImpl(state);
                continue;
            }
            if (!config.authorizedDiscordUserIds.includes(msg.author.id)) {
                state.discordLastMessageId = msg.id;
                writeDaemonStateImpl(state);
                continue;
            }
            const mapping = lookupByMessageIdImpl('discord-bot', msg.message_reference.message_id);
            state.discordLastMessageId = msg.id;
            writeDaemonStateImpl(state);
            if (!mapping) {
                if (isStatusCommand) {
                    await postDiscordReplyMessage(config, msg.id, NO_TRACKED_SESSION_MESSAGE, {
                        fetchImpl,
                        logImpl,
                    });
                }
                continue;
            }
            if (!rateLimiter.canProceed()) {
                logImpl(`WARN: Rate limit exceeded, dropping Discord message ${msg.id}`);
                state.errors++;
                continue;
            }
            if (isStatusCommand) {
                const statusMessage = await buildSessionStatusReplyImpl(mapping);
                await postDiscordReplyMessage(config, msg.id, statusMessage, {
                    fetchImpl,
                    logImpl,
                });
                continue;
            }
            const success = injectReplyImpl(mapping.tmuxPaneId, msg.content, 'discord', config);
            if (success) {
                state.messagesInjected++;
                const acknowledgement = formatReplyAcknowledgement(captureReplyAcknowledgementSummaryImpl(mapping.tmuxPaneId));
                // Add ✅ reaction to the user's reply
                try {
                    await fetchImpl(`https://discord.com/api/v10/channels/${config.discordChannelId}/messages/${msg.id}/reactions/%E2%9C%85/@me`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bot ${config.discordBotToken}` },
                        signal: AbortSignal.timeout(5000),
                    });
                }
                catch (e) {
                    logImpl(`WARN: Failed to add confirmation reaction: ${e}`);
                }
                // Send injection notification as a reply to the user's message (non-critical)
                try {
                    const feedbackAllowedMentions = config.discordMention
                        ? parseMentionAllowedMentionsImpl(config.discordMention)
                        : { parse: [] };
                    await fetchImpl(`https://discord.com/api/v10/channels/${config.discordChannelId}/messages`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bot ${config.discordBotToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            content: acknowledgement,
                            message_reference: { message_id: msg.id },
                            allowed_mentions: feedbackAllowedMentions,
                        }),
                        signal: AbortSignal.timeout(5000),
                    });
                }
                catch (e) {
                    logImpl(`WARN: Failed to send injection channel notification: ${e}`);
                }
            }
            else {
                state.errors++;
            }
        }
    }
    catch (error) {
        state.errors++;
        state.lastError = error instanceof Error ? error.message : String(error);
        logImpl(`Discord polling error: ${state.lastError}`);
    }
}
// ============================================================================
// Telegram Polling
// ============================================================================
async function pollTelegram(config, state, rateLimiter) {
    return pollTelegramOnce(config, state, rateLimiter);
}
export async function pollTelegramOnce(config, state, rateLimiter, deps = {}) {
    if (config.telegramEnabled === false)
        return;
    if (!config.telegramBotToken || !config.telegramChatId)
        return;
    const httpsRequestImpl = deps.httpsRequestImpl ?? httpsRequest;
    const injectReplyImpl = deps.injectReplyImpl ?? injectReply;
    const captureReplyAcknowledgementSummaryImpl = deps.captureReplyAcknowledgementSummaryImpl ?? captureReplyAcknowledgementSummary;
    const lookupByMessageIdImpl = deps.lookupByMessageIdImpl ?? lookupByMessageId;
    const writeDaemonStateImpl = deps.writeDaemonStateImpl ?? writeDaemonState;
    const logImpl = deps.logImpl ?? log;
    try {
        const offset = state.telegramLastUpdateId ? state.telegramLastUpdateId + 1 : 0;
        const path = `/bot${config.telegramBotToken}/getUpdates?offset=${offset}&timeout=0`;
        const updates = await new Promise((resolve, reject) => {
            const req = httpsRequestImpl({
                hostname: 'api.telegram.org',
                path,
                method: 'GET',
                family: 4,
                timeout: 10000,
            }, (res) => {
                const chunks = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => {
                    try {
                        const body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
                        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(body.result || []);
                        }
                        else {
                            reject(new Error(`HTTP ${res.statusCode}`));
                        }
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            });
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            req.end();
        });
        for (const update of updates) {
            const msg = update.message;
            if (!msg) {
                state.telegramLastUpdateId = update.update_id;
                writeDaemonStateImpl(state);
                continue;
            }
            if (!msg.reply_to_message?.message_id) {
                state.telegramLastUpdateId = update.update_id;
                writeDaemonStateImpl(state);
                continue;
            }
            if (String(msg.chat.id) !== config.telegramChatId) {
                state.telegramLastUpdateId = update.update_id;
                writeDaemonStateImpl(state);
                continue;
            }
            const mapping = lookupByMessageIdImpl('telegram', String(msg.reply_to_message.message_id));
            if (!mapping) {
                state.telegramLastUpdateId = update.update_id;
                writeDaemonStateImpl(state);
                continue;
            }
            const text = msg.text || '';
            if (!text) {
                state.telegramLastUpdateId = update.update_id;
                writeDaemonStateImpl(state);
                continue;
            }
            if (!rateLimiter.canProceed()) {
                logImpl(`WARN: Rate limit exceeded, dropping Telegram message ${msg.message_id}`);
                state.telegramLastUpdateId = update.update_id;
                writeDaemonStateImpl(state);
                state.errors++;
                continue;
            }
            state.telegramLastUpdateId = update.update_id;
            writeDaemonStateImpl(state);
            const success = injectReplyImpl(mapping.tmuxPaneId, text, 'telegram', config);
            if (success) {
                state.messagesInjected++;
                const acknowledgement = formatReplyAcknowledgement(captureReplyAcknowledgementSummaryImpl(mapping.tmuxPaneId));
                try {
                    const replyBody = JSON.stringify({
                        chat_id: config.telegramChatId,
                        text: acknowledgement,
                        reply_to_message_id: msg.message_id,
                    });
                    await new Promise((resolve) => {
                        const replyReq = httpsRequestImpl({
                            hostname: 'api.telegram.org',
                            path: `/bot${config.telegramBotToken}/sendMessage`,
                            method: 'POST',
                            family: 4,
                            headers: {
                                'Content-Type': 'application/json',
                                'Content-Length': Buffer.byteLength(replyBody),
                            },
                            timeout: 5000,
                        }, (res) => {
                            res.resume();
                            resolve();
                        });
                        replyReq.on('error', () => resolve());
                        replyReq.on('timeout', () => {
                            replyReq.destroy();
                            resolve();
                        });
                        replyReq.write(replyBody);
                        replyReq.end();
                    });
                }
                catch (e) {
                    logImpl(`WARN: Failed to send confirmation reply: ${e}`);
                }
            }
            else {
                state.errors++;
            }
        }
    }
    catch (error) {
        state.errors++;
        state.lastError = error instanceof Error ? error.message : String(error);
        logImpl(`Telegram polling error: ${state.lastError}`);
    }
}
// ============================================================================
// Main Daemon Loop
// ============================================================================
const PRUNE_INTERVAL_MS = 60 * 60 * 1000;
async function pollLoop() {
    log('Reply listener daemon starting poll loop');
    const config = readDaemonConfig();
    if (!config) {
        log('ERROR: No daemon config found, exiting');
        process.exit(1);
    }
    const state = readDaemonState() || {
        isRunning: true,
        pid: process.pid,
        startedAt: new Date().toISOString(),
        lastPollAt: null,
        telegramLastUpdateId: null,
        discordLastMessageId: null,
        messagesInjected: 0,
        errors: 0,
    };
    state.isRunning = true;
    state.pid = process.pid;
    const rateLimiter = new RateLimiter(config.rateLimitPerMinute);
    let lastPruneAt = Date.now();
    const shutdown = () => {
        log('Shutdown signal received');
        state.isRunning = false;
        writeDaemonState(state);
        removePidFile();
        process.exit(0);
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    try {
        pruneStale();
        log('Pruned stale registry entries');
    }
    catch (e) {
        log(`WARN: Failed to prune stale entries: ${e}`);
    }
    while (state.isRunning) {
        try {
            state.lastPollAt = new Date().toISOString();
            await pollDiscord(config, state, rateLimiter);
            await pollTelegram(config, state, rateLimiter);
            if (Date.now() - lastPruneAt > PRUNE_INTERVAL_MS) {
                try {
                    pruneStale();
                    lastPruneAt = Date.now();
                    log('Pruned stale registry entries');
                }
                catch (e) {
                    log(`WARN: Prune failed: ${e instanceof Error ? e.message : String(e)}`);
                }
            }
            writeDaemonState(state);
            await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
        }
        catch (error) {
            state.errors++;
            state.lastError = error instanceof Error ? error.message : String(error);
            log(`Poll error: ${state.lastError}`);
            writeDaemonState(state);
            await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs * 2));
        }
    }
    log('Poll loop ended');
}
// ============================================================================
// Daemon Control
// ============================================================================
export function startReplyListener(config) {
    if (isDaemonRunning()) {
        const state = readDaemonState();
        return {
            success: true,
            message: 'Reply listener daemon is already running',
            state: state ?? undefined,
        };
    }
    if (!isTmuxAvailable()) {
        return {
            success: false,
            message: 'tmux not available - reply injection requires tmux',
        };
    }
    const normalizedConfig = normalizeReplyListenerConfig(config);
    if (!normalizedConfig.discordEnabled && !normalizedConfig.telegramEnabled) {
        return {
            success: false,
            message: 'No enabled reply listener platforms configured',
        };
    }
    writeDaemonConfig(normalizedConfig);
    ensureStateDir();
    const modulePath = __filename.replace(/\.ts$/, '.js');
    const daemonScript = `
    import('${modulePath}').then(({ pollLoop }) => {
      return pollLoop();
    }).catch((err) => { console.error(err); process.exit(1); });
  `;
    try {
        const child = spawn('node', ['-e', daemonScript], {
            detached: true,
            stdio: 'ignore',
            windowsHide: true,
            cwd: process.cwd(),
            env: createMinimalDaemonEnv(),
        });
        child.unref();
        const pid = child.pid;
        if (pid) {
            writePidFile(pid);
            const state = {
                isRunning: true,
                pid,
                startedAt: new Date().toISOString(),
                lastPollAt: null,
                telegramLastUpdateId: null,
                discordLastMessageId: null,
                messagesInjected: 0,
                errors: 0,
            };
            writeDaemonState(state);
            log(`Reply listener daemon started with PID ${pid}`);
            return {
                success: true,
                message: `Reply listener daemon started with PID ${pid}`,
                state,
            };
        }
        return {
            success: false,
            message: 'Failed to start daemon process',
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to start daemon',
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
export function stopReplyListener() {
    const pid = readPidFile();
    if (pid === null) {
        return {
            success: true,
            message: 'Reply listener daemon is not running',
        };
    }
    if (!isProcessRunning(pid)) {
        removePidFile();
        return {
            success: true,
            message: 'Reply listener daemon was not running (cleaned up stale PID file)',
        };
    }
    if (!isReplyListenerProcess(pid)) {
        removePidFile();
        return {
            success: false,
            message: `Refusing to kill PID ${pid}: process identity does not match the reply listener daemon (stale or reused PID - removed PID file)`,
        };
    }
    try {
        process.kill(pid, 'SIGTERM');
        removePidFile();
        const state = readDaemonState();
        if (state) {
            state.isRunning = false;
            state.pid = null;
            writeDaemonState(state);
        }
        log(`Reply listener daemon stopped (PID ${pid})`);
        return {
            success: true,
            message: `Reply listener daemon stopped (PID ${pid})`,
            state: state ?? undefined,
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to stop daemon',
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
export function getReplyListenerStatus() {
    const state = readDaemonState();
    const running = isDaemonRunning();
    if (!running && !state) {
        return {
            success: true,
            message: 'Reply listener daemon has never been started',
        };
    }
    if (!running && state) {
        return {
            success: true,
            message: 'Reply listener daemon is not running',
            state: { ...state, isRunning: false, pid: null },
        };
    }
    return {
        success: true,
        message: 'Reply listener daemon is running',
        state: state ?? undefined,
    };
}
export { pollLoop };
//# sourceMappingURL=reply-listener.js.map