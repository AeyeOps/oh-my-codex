/**
 * OMX Trace MCP Server
 * Provides trace timeline and summary tools for debugging agent flows.
 * Reads .omx/logs/ turn JSONL files produced by the notify hook.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { createReadStream, existsSync } from 'fs';
import { createInterface } from 'readline';
import { listModeStateFilesWithScopePreference, resolveWorkingDirectoryForState } from './state-paths.js';
import { autoStartStdioMcpServer } from './bootstrap.js';
function text(data) {
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}
function compareTraceTimestamp(a, b) {
    return (a.timestamp || '').localeCompare(b.timestamp || '');
}
function keepLastEntries(entries, entry, limit) {
    if (limit <= 0)
        return;
    if (entries.length < limit) {
        entries.push(entry);
        entries.sort(compareTraceTimestamp);
        return;
    }
    if (compareTraceTimestamp(entry, entries[0]) <= 0)
        return;
    entries[0] = entry;
    let i = 0;
    while (i + 1 < entries.length && compareTraceTimestamp(entries[i], entries[i + 1]) > 0) {
        [entries[i], entries[i + 1]] = [entries[i + 1], entries[i]];
        i++;
    }
}
async function* iterateLogEntries(logsDir) {
    if (!existsSync(logsDir))
        return;
    const files = (await readdir(logsDir))
        .filter(f => f.startsWith('turns-') && f.endsWith('.jsonl'))
        .sort();
    for (const file of files) {
        const rl = createInterface({
            input: createReadStream(join(logsDir, file), { encoding: 'utf-8' }),
            crlfDelay: Infinity,
        });
        for await (const line of rl) {
            if (!line.trim())
                continue;
            try {
                yield JSON.parse(line);
            }
            catch (err) {
                process.stderr.write(`[trace-server] operation failed: ${err}\n`);
            }
        }
    }
}
export async function readLogFiles(logsDir, last) {
    if (last && last > 0) {
        const entries = [];
        for await (const entry of iterateLogEntries(logsDir)) {
            keepLastEntries(entries, entry, last);
        }
        return entries;
    }
    const entries = [];
    for await (const entry of iterateLogEntries(logsDir)) {
        entries.push(entry);
    }
    entries.sort(compareTraceTimestamp);
    return entries;
}
export async function summarizeLogFiles(logsDir) {
    const turnsByType = {};
    let totalTurns = 0;
    let firstTimestamp = null;
    let lastTimestamp = null;
    for await (const turn of iterateLogEntries(logsDir)) {
        totalTurns++;
        const type = turn.type || 'unknown';
        turnsByType[type] = (turnsByType[type] || 0) + 1;
        const timestamp = turn.timestamp || '';
        if (!timestamp)
            continue;
        if (!firstTimestamp || timestamp.localeCompare(firstTimestamp) < 0) {
            firstTimestamp = timestamp;
        }
        if (!lastTimestamp || timestamp.localeCompare(lastTimestamp) > 0) {
            lastTimestamp = timestamp;
        }
    }
    return { totalTurns, turnsByType, firstTimestamp, lastTimestamp };
}
export async function readModeEvents(workingDirectory) {
    const events = [];
    const refs = await listModeStateFilesWithScopePreference(workingDirectory);
    for (const ref of refs) {
        try {
            const data = JSON.parse(await readFile(ref.path, 'utf-8'));
            if (data.started_at) {
                events.push({
                    timestamp: data.started_at,
                    event: 'mode_start',
                    mode: ref.mode,
                    details: {
                        phase: data.current_phase,
                        active: data.active,
                        scope: ref.scope,
                        path: ref.path,
                    },
                });
            }
            if (data.completed_at) {
                events.push({
                    timestamp: data.completed_at,
                    event: 'mode_end',
                    mode: ref.mode,
                    details: {
                        phase: data.current_phase,
                        scope: ref.scope,
                        path: ref.path,
                    },
                });
            }
        }
        catch (err) {
            process.stderr.write(`[trace-server] operation failed: ${err}\n`);
        }
    }
    return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
async function readMetrics(omxDir) {
    const metricsPath = join(omxDir, 'metrics.json');
    if (!existsSync(metricsPath))
        return null;
    try {
        return JSON.parse(await readFile(metricsPath, 'utf-8'));
    }
    catch (err) {
        process.stderr.write(`[trace-server] operation failed: ${err}\n`);
        return null;
    }
}
// ── MCP Server ──────────────────────────────────────────────────────────────
const server = new Server({ name: 'omx-trace', version: '0.1.0' }, { capabilities: { tools: {} } });
export function buildTraceServerTools() {
    return [
        {
            name: 'trace_timeline',
            description: 'Show chronological agent flow trace timeline. Displays turns, mode transitions, and agent activity in time order.',
            inputSchema: {
                type: 'object',
                properties: {
                    last: { type: 'number', description: 'Show only the last N entries' },
                    filter: {
                        type: 'string',
                        enum: ['all', 'turns', 'modes'],
                        description: 'Filter: all (default), turns (agent turns only), modes (mode transitions only)',
                    },
                    workingDirectory: { type: 'string' },
                },
            },
        },
        {
            name: 'trace_summary',
            description: 'Show aggregate statistics for agent flow trace. Includes turn counts, mode usage, token consumption, and timing.',
            inputSchema: {
                type: 'object',
                properties: {
                    workingDirectory: { type: 'string' },
                },
            },
        },
    ];
}
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: buildTraceServerTools(),
}));
export async function handleTraceToolCall(request) {
    const { name, arguments: args } = request.params;
    const a = (args || {});
    let wd;
    try {
        wd = resolveWorkingDirectoryForState(a.workingDirectory);
    }
    catch (error) {
        return {
            content: [{ type: 'text', text: JSON.stringify({ error: error.message }) }],
            isError: true,
        };
    }
    const omxDir = join(wd, '.omx');
    const logsDir = join(omxDir, 'logs');
    switch (name) {
        case 'trace_timeline': {
            const last = a.last;
            const filter = a.filter || 'all';
            const [turns, modeEvents] = await Promise.all([
                filter !== 'modes' ? readLogFiles(logsDir, last) : Promise.resolve([]),
                filter !== 'turns' ? readModeEvents(wd) : Promise.resolve([]),
            ]);
            const timeline = [
                ...turns.map(t => ({
                    timestamp: t.timestamp,
                    type: 'turn',
                    turn_type: t.type,
                    thread_id: t.thread_id,
                    input_preview: t.input_preview,
                    output_preview: t.output_preview,
                })),
                ...modeEvents.map(e => ({
                    timestamp: e.timestamp,
                    type: e.event,
                    mode: e.mode,
                    ...e.details,
                })),
            ];
            timeline.sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
            const result = last ? timeline.slice(-last) : timeline;
            return text({
                entryCount: result.length,
                totalAvailable: timeline.length,
                filter,
                timeline: result,
            });
        }
        case 'trace_summary': {
            const [logSummary, modeEvents, metrics] = await Promise.all([
                summarizeLogFiles(logsDir),
                readModeEvents(wd),
                readMetrics(omxDir),
            ]);
            const modesByName = {};
            for (const e of modeEvents) {
                if (!modesByName[e.mode])
                    modesByName[e.mode] = { starts: 0, ends: 0 };
                if (e.event === 'mode_start')
                    modesByName[e.mode].starts++;
                if (e.event === 'mode_end')
                    modesByName[e.mode].ends++;
            }
            const firstTurn = logSummary.firstTimestamp;
            const lastTurn = logSummary.lastTimestamp;
            let durationMs = 0;
            if (firstTurn && lastTurn) {
                durationMs = new Date(lastTurn).getTime() - new Date(firstTurn).getTime();
            }
            return text({
                turns: {
                    total: logSummary.totalTurns,
                    byType: logSummary.turnsByType,
                    firstAt: firstTurn,
                    lastAt: lastTurn,
                    durationMs,
                    durationFormatted: durationMs > 0
                        ? `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`
                        : 'N/A',
                },
                modes: modesByName,
                metrics: metrics || { note: 'No metrics file found' },
            });
        }
        default:
            return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
}
server.setRequestHandler(CallToolRequestSchema, handleTraceToolCall);
autoStartStdioMcpServer('trace', server);
//# sourceMappingURL=trace-server.js.map