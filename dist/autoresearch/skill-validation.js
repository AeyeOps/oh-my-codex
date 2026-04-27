import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { getReadScopedStatePaths } from '../mcp/state-paths.js';
function safeString(value) {
    return typeof value === 'string' ? value.trim() : '';
}
function safeObject(value) {
    return value && typeof value === 'object' ? value : null;
}
function safeBoolean(value) {
    return typeof value === 'boolean' ? value : null;
}
function lookupString(raw, ...keys) {
    if (!raw)
        return '';
    for (const key of keys) {
        const direct = safeString(raw[key]);
        if (direct)
            return direct;
    }
    const nestedState = safeObject(raw.state);
    if (nestedState) {
        for (const key of keys) {
            const nested = safeString(nestedState[key]);
            if (nested)
                return nested;
        }
    }
    return '';
}
function lookupBoolean(raw, ...keys) {
    if (!raw)
        return null;
    for (const key of keys) {
        const direct = safeBoolean(raw[key]);
        if (direct !== null)
            return direct;
    }
    const nestedState = safeObject(raw.state);
    if (nestedState) {
        for (const key of keys) {
            const nested = safeBoolean(nestedState[key]);
            if (nested !== null)
                return nested;
        }
    }
    return null;
}
export function normalizeAutoresearchValidationMode(value) {
    const normalized = safeString(value).toLowerCase();
    if (normalized === 'mission-validator-script')
        return 'mission-validator-script';
    if (normalized === 'prompt-architect-artifact')
        return 'prompt-architect-artifact';
    return null;
}
function resolveMaybeRelativePath(cwd, rawPath) {
    if (!rawPath)
        return rawPath;
    return rawPath.startsWith('/') ? rawPath : join(cwd, rawPath);
}
function deriveDefaultArtifactPath(cwd, rawState) {
    const slug = lookupString(rawState, 'slug', 'mission_slug', 'missionSlug');
    if (!slug)
        return null;
    return join(cwd, '.omx', 'specs', `autoresearch-${slug}`, 'completion.json');
}
function resolveArtifactPath(cwd, rawState) {
    const explicit = lookupString(rawState, 'completion_artifact_path', 'completionArtifactPath', 'validator_artifact_path', 'validatorArtifactPath');
    if (explicit)
        return resolveMaybeRelativePath(cwd, explicit);
    return deriveDefaultArtifactPath(cwd, rawState);
}
async function readJsonIfExists(path) {
    if (!path || !existsSync(path))
        return null;
    try {
        return JSON.parse(await readFile(path, 'utf-8'));
    }
    catch {
        return null;
    }
}
function isPassingStatus(value) {
    const normalized = safeString(value).toLowerCase();
    return ['pass', 'passed', 'complete', 'completed', 'success', 'succeeded', 'approved'].includes(normalized);
}
function hasArchitectApproval(artifact) {
    if (!artifact)
        return false;
    const direct = lookupBoolean(artifact, 'architect_approved', 'architectApproved', 'approved');
    if (direct === true)
        return true;
    const architectReview = safeObject(artifact.architect_review) ?? safeObject(artifact.architectReview);
    const architectValidation = safeObject(artifact.architect_validation) ?? safeObject(artifact.architectValidation);
    return isPassingStatus(architectReview?.verdict) || isPassingStatus(architectValidation?.verdict);
}
function resolveOutputArtifactPath(cwd, rawState, artifact) {
    const explicit = lookupString(rawState, 'output_artifact_path', 'outputArtifactPath')
        || lookupString(artifact, 'output_artifact_path', 'outputArtifactPath');
    if (!explicit)
        return null;
    return resolveMaybeRelativePath(cwd, explicit);
}
export async function assessAutoresearchCompletionState(rawState, cwd) {
    const validationMode = normalizeAutoresearchValidationMode(lookupString(rawState, 'validation_mode', 'validationMode'));
    if (!rawState) {
        return { complete: false, reason: 'missing_mode_state', validationMode: null, artifactPath: null };
    }
    if (!validationMode) {
        return { complete: false, reason: 'missing_validation_mode', validationMode: null, artifactPath: resolveArtifactPath(cwd, rawState) };
    }
    const artifactPath = resolveArtifactPath(cwd, rawState);
    const artifact = await readJsonIfExists(artifactPath);
    if (!artifactPath) {
        return { complete: false, reason: 'missing_completion_artifact_path', validationMode, artifactPath: null };
    }
    if (!artifact) {
        return { complete: false, reason: 'missing_or_invalid_completion_artifact', validationMode, artifactPath };
    }
    if (validationMode === 'mission-validator-script') {
        const validatorCommand = lookupString(rawState, 'mission_validator_command', 'missionValidatorCommand')
            || lookupString(safeObject(rawState.mission_validator), 'command');
        if (!validatorCommand) {
            return { complete: false, reason: 'missing_mission_validator_command', validationMode, artifactPath };
        }
        if (lookupBoolean(artifact, 'passed', 'complete', 'completed', 'valid') === true || isPassingStatus(artifact.status)) {
            return { complete: true, reason: 'validator_passed', validationMode, artifactPath };
        }
        return { complete: false, reason: 'validator_not_passed', validationMode, artifactPath };
    }
    const validatorPrompt = lookupString(rawState, 'validator_prompt', 'validatorPrompt')
        || lookupString(artifact, 'validator_prompt', 'validatorPrompt');
    if (!validatorPrompt) {
        return { complete: false, reason: 'missing_validator_prompt', validationMode, artifactPath };
    }
    const outputArtifactPath = resolveOutputArtifactPath(cwd, rawState, artifact);
    if (!outputArtifactPath || !existsSync(outputArtifactPath)) {
        return { complete: false, reason: 'missing_output_artifact', validationMode, artifactPath, outputArtifactPath };
    }
    if (!hasArchitectApproval(artifact)) {
        return { complete: false, reason: 'missing_architect_approval', validationMode, artifactPath, outputArtifactPath };
    }
    return { complete: true, reason: 'architect_approved', validationMode, artifactPath, outputArtifactPath };
}
export async function readAutoresearchModeState(cwd, sessionId) {
    const candidates = await getReadScopedStatePaths('autoresearch', cwd, sessionId);
    for (const candidatePath of candidates) {
        if (!existsSync(candidatePath))
            continue;
        try {
            return JSON.parse(await readFile(candidatePath, 'utf-8'));
        }
        catch {
            continue;
        }
    }
    return null;
}
export async function readAutoresearchCompletionStatus(cwd, sessionId) {
    const state = await readAutoresearchModeState(cwd, sessionId);
    return assessAutoresearchCompletionState(state, cwd);
}
//# sourceMappingURL=skill-validation.js.map