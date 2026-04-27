import { getAgent } from '../agents/definitions.js';
import { DEFAULT_SPARK_MODEL, getMainDefaultModel, getSparkDefaultModel, getStandardDefaultModel, } from '../config/models.js';
const MADMAX_FLAG = '--madmax';
const CODEX_BYPASS_FLAG = '--dangerously-bypass-approvals-and-sandbox';
const MODEL_FLAG = '--model';
const CONFIG_FLAG = '-c';
const REASONING_KEY = 'model_reasoning_effort';
const LOW_COMPLEXITY_AGENT_TYPES = new Set([
    'explore',
    'explorer',
    'style-reviewer',
]);
// Canonical default only; effective low-complexity resolution flows through resolveTeamLowComplexityDefaultModel().
export const TEAM_LOW_COMPLEXITY_DEFAULT_MODEL = DEFAULT_SPARK_MODEL;
function isReasoningOverride(value) {
    return new RegExp(`^${REASONING_KEY}\\s*=`).test(value.trim());
}
function isValidModelValue(value) {
    return value.trim().length > 0 && !value.startsWith('-');
}
function normalizeOptionalModel(model) {
    if (typeof model !== 'string')
        return undefined;
    const trimmed = model.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
function normalizeOptionalReasoning(reasoning) {
    if (typeof reasoning !== 'string')
        return undefined;
    const normalized = reasoning.trim().toLowerCase();
    if (normalized === 'low' || normalized === 'medium' || normalized === 'high' || normalized === 'xhigh') {
        return normalized;
    }
    return undefined;
}
export function splitWorkerLaunchArgs(raw) {
    if (!raw || raw.trim() === '')
        return [];
    return raw
        .split(/\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
}
export function parseTeamWorkerLaunchArgs(args) {
    const passthrough = [];
    let wantsBypass = false;
    let reasoningOverride = null;
    let modelOverride = null;
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === CODEX_BYPASS_FLAG || arg === MADMAX_FLAG) {
            wantsBypass = true;
            continue;
        }
        if (arg === MODEL_FLAG) {
            const maybeValue = args[i + 1];
            if (typeof maybeValue === 'string' && isValidModelValue(maybeValue)) {
                modelOverride = maybeValue.trim();
                i += 1;
            }
            // Orphan --model with no valid value is silently dropped (never passthrough)
            continue;
        }
        if (arg.startsWith(`${MODEL_FLAG}=`)) {
            const inlineValue = arg.slice(`${MODEL_FLAG}=`.length).trim();
            if (isValidModelValue(inlineValue)) {
                modelOverride = inlineValue;
            }
            // --model= with empty/invalid value is silently dropped (never passthrough)
            continue;
        }
        if (arg === CONFIG_FLAG) {
            const maybeValue = args[i + 1];
            if (typeof maybeValue === 'string' && isReasoningOverride(maybeValue)) {
                reasoningOverride = maybeValue;
                i += 1;
                continue;
            }
        }
        passthrough.push(arg);
    }
    return {
        passthrough,
        wantsBypass,
        reasoningOverride,
        modelOverride,
    };
}
export function collectInheritableTeamWorkerArgs(codexArgs) {
    const parsed = parseTeamWorkerLaunchArgs(codexArgs);
    const inherited = [];
    if (parsed.wantsBypass)
        inherited.push(CODEX_BYPASS_FLAG);
    if (parsed.reasoningOverride)
        inherited.push(CONFIG_FLAG, parsed.reasoningOverride);
    if (parsed.modelOverride)
        inherited.push(MODEL_FLAG, parsed.modelOverride);
    return inherited;
}
export function normalizeTeamWorkerLaunchArgs(args, preferredModel, preferredReasoning) {
    const parsed = parseTeamWorkerLaunchArgs(args);
    const normalized = [...parsed.passthrough];
    if (parsed.wantsBypass)
        normalized.push(CODEX_BYPASS_FLAG);
    const selectedReasoning = parsed.reasoningOverride
        ?? (normalizeOptionalReasoning(preferredReasoning)
            ? `${REASONING_KEY}="${normalizeOptionalReasoning(preferredReasoning)}"`
            : null);
    if (selectedReasoning)
        normalized.push(CONFIG_FLAG, selectedReasoning);
    const selectedModel = normalizeOptionalModel(preferredModel) ?? normalizeOptionalModel(parsed.modelOverride);
    if (selectedModel)
        normalized.push(MODEL_FLAG, selectedModel);
    return normalized;
}
export function resolveTeamWorkerLaunchArgs(options) {
    const envArgs = splitWorkerLaunchArgs(options.existingRaw);
    const inheritedArgs = options.inheritedArgs ?? [];
    const allArgs = [...envArgs, ...inheritedArgs];
    const envModel = normalizeOptionalModel(parseTeamWorkerLaunchArgs(envArgs).modelOverride);
    const inheritedModel = normalizeOptionalModel(parseTeamWorkerLaunchArgs(inheritedArgs).modelOverride);
    const fallbackModel = normalizeOptionalModel(options.fallbackModel);
    const selectedModel = envModel ?? inheritedModel ?? fallbackModel;
    return normalizeTeamWorkerLaunchArgs(allArgs, selectedModel, options.preferredReasoning);
}
export function resolveAgentReasoningEffort(agentType) {
    if (typeof agentType !== 'string' || agentType.trim() === '')
        return undefined;
    return normalizeOptionalReasoning(getAgent(agentType)?.reasoningEffort);
}
export function resolveAgentDefaultModel(agentType, codexHomeOverride) {
    if (typeof agentType !== 'string' || agentType.trim() === '')
        return undefined;
    const normalized = agentType.trim().toLowerCase();
    if (normalized === '')
        return undefined;
    if (normalized.endsWith('-low'))
        return resolveTeamLowComplexityDefaultModel(codexHomeOverride);
    if (normalized === 'executor')
        return getMainDefaultModel(codexHomeOverride);
    switch (getAgent(normalized)?.modelClass) {
        case 'fast':
            return resolveTeamLowComplexityDefaultModel(codexHomeOverride);
        case 'frontier':
            return getMainDefaultModel(codexHomeOverride);
        case 'standard':
            return getStandardDefaultModel(codexHomeOverride);
        default:
            return undefined;
    }
}
export function isLowComplexityAgentType(agentType) {
    if (!agentType)
        return false;
    const normalized = agentType.trim().toLowerCase();
    if (normalized === '')
        return false;
    if (normalized.endsWith('-low'))
        return true;
    return LOW_COMPLEXITY_AGENT_TYPES.has(normalized);
}
export function resolveTeamLowComplexityDefaultModel(codexHomeOverride) {
    return getSparkDefaultModel(codexHomeOverride);
}
//# sourceMappingURL=model-contract.js.map