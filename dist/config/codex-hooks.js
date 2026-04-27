import { join } from "path";
export const MANAGED_HOOK_EVENTS = [
    "SessionStart",
    "PreToolUse",
    "PostToolUse",
    "UserPromptSubmit",
    "Stop",
];
function isPlainObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function cloneJson(value) {
    return structuredClone(value);
}
function buildCommandHook(command, options = {}) {
    const hook = {
        type: "command",
        command,
        ...(options.statusMessage ? { statusMessage: options.statusMessage } : {}),
        ...(typeof options.timeout === "number" ? { timeout: options.timeout } : {}),
    };
    return {
        ...(options.matcher ? { matcher: options.matcher } : {}),
        hooks: [hook],
    };
}
export function buildManagedCodexHooksConfig(pkgRoot) {
    const hookScript = join(pkgRoot, "dist", "scripts", "codex-native-hook.js");
    const command = `node "${hookScript}"`;
    return {
        hooks: {
            SessionStart: [
                buildCommandHook(command, {
                    matcher: "startup|resume",
                }),
            ],
            PreToolUse: [
                buildCommandHook(command, {
                    matcher: "Bash",
                }),
            ],
            PostToolUse: [
                buildCommandHook(command),
            ],
            UserPromptSubmit: [
                buildCommandHook(command),
            ],
            Stop: [
                buildCommandHook(command, {
                    timeout: 30,
                }),
            ],
        },
    };
}
export function parseCodexHooksConfig(content) {
    try {
        const parsed = JSON.parse(content);
        if (!isPlainObject(parsed))
            return null;
        return {
            root: cloneJson(parsed),
            hooks: isPlainObject(parsed.hooks) ? cloneJson(parsed.hooks) : {},
        };
    }
    catch {
        return null;
    }
}
function isOmxManagedHookCommand(command) {
    return /(?:^|[\\/])codex-native-hook\.js(?:["'\s]|$)/.test(command);
}
function countManagedHooksInEntry(entry) {
    if (!isPlainObject(entry) || !Array.isArray(entry.hooks)) {
        return 0;
    }
    return entry.hooks.filter((hook) => {
        return isPlainObject(hook)
            && hook.type === "command"
            && typeof hook.command === "string"
            && isOmxManagedHookCommand(hook.command);
    }).length;
}
export function getMissingManagedCodexHookEvents(content) {
    const parsed = parseCodexHooksConfig(content);
    if (!parsed)
        return null;
    return MANAGED_HOOK_EVENTS.filter((eventName) => {
        const entries = Array.isArray(parsed.hooks[eventName])
            ? parsed.hooks[eventName]
            : [];
        return !entries.some((entry) => countManagedHooksInEntry(entry) > 0);
    });
}
function stripManagedHooksFromEntry(entry) {
    if (!isPlainObject(entry) || !Array.isArray(entry.hooks)) {
        return { entry: cloneJson(entry), removedCount: 0 };
    }
    const nextHooks = entry.hooks.filter((hook) => {
        if (!isPlainObject(hook))
            return true;
        return !(hook.type === "command" &&
            typeof hook.command === "string" &&
            isOmxManagedHookCommand(hook.command));
    });
    const removedCount = entry.hooks.length - nextHooks.length;
    if (removedCount === 0) {
        return { entry: cloneJson(entry), removedCount: 0 };
    }
    if (nextHooks.length === 0) {
        return { entry: null, removedCount };
    }
    return {
        entry: {
            ...cloneJson(entry),
            hooks: nextHooks,
        },
        removedCount,
    };
}
function serializeCodexHooksConfig(root) {
    return JSON.stringify(root, null, 2) + "\n";
}
export function mergeManagedCodexHooksConfig(existingContent, pkgRoot) {
    const managedConfig = buildManagedCodexHooksConfig(pkgRoot);
    const parsed = typeof existingContent === "string"
        ? parseCodexHooksConfig(existingContent)
        : null;
    const nextRoot = parsed ? cloneJson(parsed.root) : {};
    const nextHooks = parsed ? cloneJson(parsed.hooks) : {};
    for (const eventName of MANAGED_HOOK_EVENTS) {
        const existingEntries = Array.isArray(nextHooks[eventName])
            ? nextHooks[eventName]
            : [];
        const preservedEntries = [];
        for (const entry of existingEntries) {
            const stripped = stripManagedHooksFromEntry(entry);
            if (stripped.entry !== null) {
                preservedEntries.push(stripped.entry);
            }
        }
        nextHooks[eventName] = [
            ...preservedEntries,
            ...managedConfig.hooks[eventName].map((entry) => cloneJson(entry)),
        ];
    }
    if (Object.keys(nextHooks).length > 0) {
        nextRoot.hooks = nextHooks;
    }
    else {
        delete nextRoot.hooks;
    }
    return serializeCodexHooksConfig(nextRoot);
}
export function removeManagedCodexHooks(existingContent) {
    const parsed = parseCodexHooksConfig(existingContent);
    if (!parsed) {
        return { nextContent: existingContent, removedCount: 0 };
    }
    const nextRoot = cloneJson(parsed.root);
    const nextHooks = cloneJson(parsed.hooks);
    let removedCount = 0;
    for (const [eventName, rawEntries] of Object.entries(nextHooks)) {
        if (!Array.isArray(rawEntries))
            continue;
        const preservedEntries = [];
        for (const entry of rawEntries) {
            const stripped = stripManagedHooksFromEntry(entry);
            removedCount += stripped.removedCount;
            if (stripped.entry !== null) {
                preservedEntries.push(stripped.entry);
            }
        }
        if (preservedEntries.length > 0) {
            nextHooks[eventName] = preservedEntries;
        }
        else {
            delete nextHooks[eventName];
        }
    }
    if (removedCount === 0) {
        return { nextContent: existingContent, removedCount: 0 };
    }
    if (Object.keys(nextHooks).length > 0) {
        nextRoot.hooks = nextHooks;
    }
    else {
        delete nextRoot.hooks;
    }
    if (Object.keys(nextRoot).length === 0) {
        return { nextContent: null, removedCount };
    }
    return {
        nextContent: serializeCodexHooksConfig(nextRoot),
        removedCount,
    };
}
//# sourceMappingURL=codex-hooks.js.map