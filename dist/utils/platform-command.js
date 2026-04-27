import { statSync } from 'fs';
import { spawnSync } from 'child_process';
import { basename, delimiter, dirname, extname, join, resolve } from 'path';
const WINDOWS_DEFAULT_PATHEXT = ['.com', '.exe', '.bat', '.cmd', '.ps1'];
const WINDOWS_DIRECT_EXTENSIONS = new Set(['.com', '.exe']);
const WINDOWS_CMD_EXTENSIONS = new Set(['.bat', '.cmd']);
const WINDOWS_EXTENSION_PRIORITY = ['.exe', '.com', '.cmd', '.bat', '.ps1'];
const NODE_HOSTED_SCRIPT_EXTENSIONS = new Set(['.js', '.mjs', '.cjs']);
const WINDOWS_COMPATIBLE_COMMAND_ALIASES = {
    tmux: ['tmux', 'psmux'],
};
const WINDOWS_NODE_HOSTED_COMMANDS = {
    codex: ['node_modules', '@openai', 'codex', 'bin', 'codex.js'],
};
function existsFileSync(path) {
    try {
        return statSync(path).isFile();
    }
    catch {
        return false;
    }
}
function isWindowsPathLike(command) {
    return /^[A-Za-z]:/.test(command) || /[\\/]/.test(command);
}
function normalizeWindowsPathext(env) {
    const raw = String(env.PATHEXT ?? '').trim();
    if (raw === '')
        return WINDOWS_DEFAULT_PATHEXT;
    const entries = raw
        .split(';')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
    const ordered = [...WINDOWS_EXTENSION_PRIORITY, ...entries];
    return [...new Set(ordered)];
}
function classifyWindowsCommandPath(path) {
    const extension = extname(path).toLowerCase();
    if (WINDOWS_CMD_EXTENSIONS.has(extension))
        return 'cmd';
    if (extension === '.ps1')
        return 'powershell';
    if (WINDOWS_DIRECT_EXTENSIONS.has(extension))
        return 'direct';
    return 'direct';
}
function normalizeWindowsCommandName(command) {
    return basename(command, extname(command)).toLowerCase();
}
function resolveWindowsCommandVariants(command) {
    if (isWindowsPathLike(command))
        return [command];
    const extension = extname(command);
    const aliases = WINDOWS_COMPATIBLE_COMMAND_ALIASES[normalizeWindowsCommandName(command)];
    if (!aliases || aliases.length === 0)
        return [command];
    return [...new Set(aliases.map((alias) => `${alias}${extension}`))];
}
function resolveWindowsNodeHostedCommandPath(command, resolvedPath, existsImpl) {
    const relativeSegments = WINDOWS_NODE_HOSTED_COMMANDS[normalizeWindowsCommandName(command)];
    if (!relativeSegments)
        return null;
    if (classifyWindowsCommandPath(resolvedPath) === 'direct')
        return null;
    const candidates = [
        join(dirname(resolvedPath), ...relativeSegments),
        join(dirname(resolvedPath), '..', ...relativeSegments.slice(1)),
        join(dirname(resolvedPath), '..', ...relativeSegments),
    ];
    for (const candidate of candidates) {
        if (existsImpl(candidate))
            return candidate;
    }
    return null;
}
function resolveWindowsCommandPath(command, env, existsImpl) {
    const pathext = normalizeWindowsPathext(env);
    const pathEntries = String(env.Path ?? env.PATH ?? '')
        .split(delimiter)
        .map((value) => value.trim())
        .filter(Boolean);
    for (const commandVariant of resolveWindowsCommandVariants(command)) {
        const candidates = [];
        const extension = extname(commandVariant).toLowerCase();
        const addCandidatesForBase = (base) => {
            if (extension) {
                candidates.push(base);
                return;
            }
            for (const ext of pathext) {
                candidates.push(`${base}${ext}`);
            }
            candidates.push(base);
        };
        if (isWindowsPathLike(commandVariant)) {
            addCandidatesForBase(commandVariant);
        }
        else {
            for (const entry of pathEntries) {
                addCandidatesForBase(join(entry, commandVariant));
            }
        }
        for (const candidate of candidates) {
            if (existsImpl(candidate))
                return candidate;
        }
    }
    return null;
}
function resolvePosixCommandPath(command, env, existsImpl) {
    const trimmed = command.trim();
    if (trimmed === '')
        return null;
    if (trimmed.includes('/')) {
        const candidate = resolve(trimmed);
        return existsImpl(candidate) ? candidate : null;
    }
    const pathEntries = String(env.PATH ?? env.Path ?? '')
        .split(delimiter)
        .map((value) => value.trim())
        .filter(Boolean);
    for (const entry of pathEntries) {
        const candidate = resolve(entry, trimmed);
        if (existsImpl(candidate))
            return candidate;
    }
    return null;
}
function quoteForCmd(value) {
    return `"${value.replace(/"/g, '""')}"`;
}
function buildCmdLaunch(commandPath, args, env) {
    const commandLine = [commandPath, ...args].map(quoteForCmd).join(' ');
    return {
        command: env.ComSpec || 'cmd.exe',
        args: ['/d', '/s', '/c', `"${commandLine}"`],
        resolvedPath: commandPath,
    };
}
function resolvePowerShellExecutable(env, existsImpl) {
    return resolveWindowsCommandPath('powershell', env, existsImpl) || 'powershell.exe';
}
function shouldUseWindowsVerbatimArguments(platform, spec) {
    return (platform === 'win32' &&
        typeof spec.resolvedPath === 'string' &&
        classifyWindowsCommandPath(spec.resolvedPath) === 'cmd');
}
export function classifySpawnError(error) {
    if (!error)
        return null;
    if (error.code === 'ENOENT')
        return 'missing';
    if (error.code === 'EPERM' || error.code === 'EACCES')
        return 'blocked';
    return 'error';
}
export function resolveCommandPathForPlatform(command, platform = process.platform, env = process.env, existsImpl = existsFileSync) {
    if (platform === 'win32') {
        return resolveWindowsCommandPath(command, env, existsImpl);
    }
    return resolvePosixCommandPath(command, env, existsImpl);
}
export function resolveTmuxBinaryForPlatform(platform = process.platform, env = process.env, existsImpl = existsFileSync) {
    return resolveCommandPathForPlatform('tmux', platform, env, existsImpl);
}
export function buildPlatformCommandSpec(command, args, platform = process.platform, env = process.env, existsImpl = existsFileSync) {
    if (platform !== 'win32') {
        return { command, args: [...args] };
    }
    const resolvedPath = resolveWindowsCommandPath(command, env, existsImpl);
    if (!resolvedPath) {
        return { command, args: [...args] };
    }
    const kind = classifyWindowsCommandPath(resolvedPath);
    const nodeHostedPath = resolveWindowsNodeHostedCommandPath(command, resolvedPath, existsImpl);
    if (nodeHostedPath) {
        return {
            command: process.execPath,
            args: [nodeHostedPath, ...args],
            resolvedPath: nodeHostedPath,
        };
    }
    if (kind === 'cmd') {
        return buildCmdLaunch(resolvedPath, args, env);
    }
    if (kind === 'powershell') {
        return {
            command: resolvePowerShellExecutable(env, existsImpl),
            args: ['-NoLogo', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', resolvedPath, ...args],
            resolvedPath,
        };
    }
    return {
        command: resolvedPath,
        args: [...args],
        resolvedPath,
    };
}
function shouldRetryWithNodeHost(spec, error, platform) {
    if (platform === 'win32')
        return false;
    if (classifySpawnError(error) !== 'blocked')
        return false;
    return NODE_HOSTED_SCRIPT_EXTENSIONS.has(extname(spec.command).toLowerCase());
}
export function spawnPlatformCommandSync(command, args, options = { encoding: 'utf-8' }, platform = process.platform, env = process.env, existsImpl = existsFileSync, spawnImpl = spawnSync) {
    const spec = buildPlatformCommandSpec(command, args, platform, env, existsImpl);
    const baseOptions = platform === 'win32' ? { ...options, windowsHide: true } : options;
    const spawnOptions = shouldUseWindowsVerbatimArguments(platform, spec)
        ? { ...baseOptions, windowsVerbatimArguments: true }
        : baseOptions;
    const result = spawnImpl(spec.command, spec.args, spawnOptions);
    if (!shouldRetryWithNodeHost(spec, result.error, platform)) {
        return { spec, result };
    }
    const retrySpec = {
        command: process.execPath,
        args: [spec.command, ...spec.args],
        resolvedPath: spec.command,
    };
    const retryResult = spawnImpl(retrySpec.command, retrySpec.args, spawnOptions);
    return { spec: retrySpec, result: retryResult };
}
//# sourceMappingURL=platform-command.js.map