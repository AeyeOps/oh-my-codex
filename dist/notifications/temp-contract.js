export const OMX_NOTIFY_TEMP_ENV = 'OMX_NOTIFY_TEMP';
export const OMX_NOTIFY_TEMP_CONTRACT_ENV = 'OMX_NOTIFY_TEMP_CONTRACT';
function normalizeCustomSelector(raw) {
    const normalized = raw.trim().toLowerCase();
    if (!normalized)
        return null;
    if (normalized.startsWith('openclaw:')) {
        const gateway = normalized.slice('openclaw:'.length).trim();
        if (!gateway)
            return null;
        return `openclaw:${gateway}`;
    }
    return `custom:${normalized}`;
}
function toUnique(values) {
    return [...new Set(values)];
}
export function parseNotifyTempContractFromArgs(args, env = process.env) {
    const passthroughArgs = [];
    const selectors = [];
    const warnings = [];
    let cliActivated = false;
    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];
        if (arg === '--notify-temp') {
            cliActivated = true;
            continue;
        }
        if (arg === '--discord' || arg === '--slack' || arg === '--telegram') {
            selectors.push(arg.slice(2));
            continue;
        }
        if (arg === '--custom') {
            const next = args[index + 1];
            if (!next || next.startsWith('-')) {
                warnings.push('notify temp: ignoring --custom without a provider name');
                continue;
            }
            const normalized = normalizeCustomSelector(next);
            if (!normalized) {
                warnings.push(`notify temp: ignoring invalid --custom selector "${next}"`);
            }
            else {
                selectors.push(normalized);
            }
            index += 1;
            continue;
        }
        if (arg.startsWith('--custom=')) {
            const raw = arg.slice('--custom='.length);
            const normalized = normalizeCustomSelector(raw);
            if (!normalized) {
                warnings.push(`notify temp: ignoring invalid --custom selector "${raw}"`);
            }
            else {
                selectors.push(normalized);
            }
            continue;
        }
        passthroughArgs.push(arg);
    }
    const envActivated = env[OMX_NOTIFY_TEMP_ENV] === '1';
    const canonicalSelectors = toUnique(selectors);
    const providerActivated = canonicalSelectors.length > 0;
    const active = cliActivated || envActivated || providerActivated;
    if (providerActivated && !cliActivated && !envActivated) {
        warnings.push('notify temp: provider selectors imply temp mode (auto-activated)');
    }
    let source = 'none';
    if (cliActivated)
        source = 'cli';
    else if (envActivated)
        source = 'env';
    else if (providerActivated)
        source = 'providers';
    return {
        contract: {
            active,
            selectors: [...selectors],
            canonicalSelectors,
            warnings,
            source,
        },
        passthroughArgs,
    };
}
export function serializeNotifyTempContract(contract) {
    return JSON.stringify(contract);
}
export function isNotifyTempEnvActive(env = process.env) {
    return env[OMX_NOTIFY_TEMP_ENV] === '1';
}
export function readNotifyTempContractFromEnv(env = process.env) {
    const raw = env[OMX_NOTIFY_TEMP_CONTRACT_ENV];
    if (!raw)
        return null;
    try {
        const parsed = JSON.parse(raw);
        if (typeof parsed.active !== 'boolean'
            || !Array.isArray(parsed.selectors)
            || !Array.isArray(parsed.canonicalSelectors)
            || !Array.isArray(parsed.warnings)
            || typeof parsed.source !== 'string') {
            return null;
        }
        return {
            active: parsed.active,
            selectors: parsed.selectors.filter((entry) => typeof entry === 'string'),
            canonicalSelectors: parsed.canonicalSelectors.filter((entry) => typeof entry === 'string'),
            warnings: parsed.warnings.filter((entry) => typeof entry === 'string'),
            source: parsed.source,
        };
    }
    catch {
        return null;
    }
}
export function isOpenClawSelectedInTempContract(contract) {
    if (!contract?.active)
        return false;
    return contract.canonicalSelectors.some((selector) => selector.startsWith('openclaw:') || selector.startsWith('custom:'));
}
export function getTempBuiltinSelectors(contract) {
    if (!contract?.active)
        return new Set();
    return new Set(contract.canonicalSelectors.filter((selector) => selector === 'discord' || selector === 'slack' || selector === 'telegram'));
}
export function getSelectedOpenClawGatewayNames(contract) {
    if (!contract?.active)
        return new Set();
    const names = [];
    for (const selector of contract.canonicalSelectors) {
        if (selector.startsWith('openclaw:')) {
            const name = selector.slice('openclaw:'.length).trim().toLowerCase();
            if (name)
                names.push(name);
            continue;
        }
        if (selector.startsWith('custom:')) {
            const name = selector.slice('custom:'.length).trim().toLowerCase();
            if (name)
                names.push(name);
        }
    }
    return new Set(names);
}
//# sourceMappingURL=temp-contract.js.map