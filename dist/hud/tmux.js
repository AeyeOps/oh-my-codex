import { execFileSync } from 'child_process';
import { HUD_TMUX_HEIGHT_LINES } from './constants.js';
import { resolveTmuxBinaryForPlatform } from '../utils/platform-command.js';
function defaultExecTmuxSync(args) {
    return execFileSync(resolveTmuxBinaryForPlatform() || 'tmux', args, {
        encoding: 'utf-8',
        ...(process.platform === 'win32' ? { windowsHide: true } : {}),
    });
}
export function parseTmuxPaneSnapshot(output) {
    return output
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
        const [paneId = '', currentCommand = '', ...startCommandParts] = line.split('\t');
        return {
            paneId: paneId.trim(),
            currentCommand: currentCommand.trim(),
            startCommand: startCommandParts.join('\t').trim(),
        };
    })
        .filter((pane) => pane.paneId.startsWith('%'));
}
export function isHudWatchPane(pane) {
    const command = `${pane.startCommand} ${pane.currentCommand}`.toLowerCase();
    return (/\bhud\b/.test(command)
        && /--watch\b/.test(command)
        && (/\bomx(?:\.js)?\b/.test(command) || /\bnode\b/.test(command)));
}
export function findHudWatchPaneIds(panes, currentPaneId) {
    return panes
        .filter((pane) => pane.paneId !== currentPaneId)
        .filter((pane) => isHudWatchPane(pane))
        .map((pane) => pane.paneId);
}
export function parsePaneIdFromTmuxOutput(rawOutput) {
    const paneId = rawOutput.split('\n')[0]?.trim() || '';
    return paneId.startsWith('%') ? paneId : null;
}
export function shellEscapeSingle(value) {
    return `'${value.replace(/'/g, `'\\''`)}'`;
}
export function buildHudWatchCommand(omxBin, preset, sessionId) {
    const safePreset = preset === 'minimal' || preset === 'focused' || preset === 'full'
        ? ` --preset=${preset}`
        : '';
    const safeSessionId = typeof sessionId === 'string' ? sessionId.trim() : '';
    const sessionPrefix = safeSessionId ? `OMX_SESSION_ID=${shellEscapeSingle(safeSessionId)} ` : '';
    return `${sessionPrefix}node ${shellEscapeSingle(omxBin)} hud --watch${safePreset}`;
}
export function listCurrentWindowPanes(execTmuxSync = defaultExecTmuxSync, currentPaneId) {
    try {
        return parseTmuxPaneSnapshot(execTmuxSync([
            'list-panes',
            ...(currentPaneId ? ['-t', currentPaneId] : []),
            '-F',
            '#{pane_id}\t#{pane_current_command}\t#{pane_start_command}',
        ]));
    }
    catch {
        return [];
    }
}
export function listCurrentWindowHudPaneIds(currentPaneId, execTmuxSync = defaultExecTmuxSync) {
    return findHudWatchPaneIds(listCurrentWindowPanes(execTmuxSync, currentPaneId), currentPaneId);
}
export function readCurrentWindowSize(execTmuxSync = defaultExecTmuxSync, currentPaneId) {
    try {
        const raw = execTmuxSync([
            'display-message',
            '-p',
            ...(currentPaneId ? ['-t', currentPaneId] : []),
            '#{window_width}\t#{window_height}',
        ]);
        const [widthRaw = '', heightRaw = ''] = raw.split('\t');
        const width = Number.parseInt(widthRaw.trim(), 10);
        const height = Number.parseInt(heightRaw.trim(), 10);
        return {
            width: Number.isFinite(width) && width > 0 ? width : null,
            height: Number.isFinite(height) && height > 0 ? height : null,
        };
    }
    catch {
        return { width: null, height: null };
    }
}
export function createHudWatchPane(cwd, hudCmd, options = {}, execTmuxSync = defaultExecTmuxSync) {
    const heightLines = Number.isFinite(options.heightLines) && (options.heightLines ?? 0) > 0
        ? Math.floor(options.heightLines ?? HUD_TMUX_HEIGHT_LINES)
        : HUD_TMUX_HEIGHT_LINES;
    const args = [
        'split-window',
        '-v',
        ...(options.fullWidth ? ['-f'] : []),
        '-l',
        String(heightLines),
        '-d',
        ...(options.targetPaneId ? ['-t', options.targetPaneId] : []),
        '-c',
        cwd,
        '-P',
        '-F',
        '#{pane_id}',
        hudCmd,
    ];
    try {
        return parsePaneIdFromTmuxOutput(execTmuxSync(args));
    }
    catch {
        return null;
    }
}
export function killTmuxPane(paneId, execTmuxSync = defaultExecTmuxSync) {
    if (!paneId.startsWith('%'))
        return false;
    try {
        execTmuxSync(['kill-pane', '-t', paneId]);
        return true;
    }
    catch {
        return false;
    }
}
export function resizeTmuxPane(paneId, heightLines, execTmuxSync = defaultExecTmuxSync) {
    if (!paneId.startsWith('%'))
        return false;
    const height = Number.isFinite(heightLines) && heightLines > 0
        ? Math.floor(heightLines)
        : HUD_TMUX_HEIGHT_LINES;
    try {
        execTmuxSync(['resize-pane', '-t', paneId, '-y', String(height)]);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=tmux.js.map