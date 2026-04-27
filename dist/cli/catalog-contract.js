import { tryReadCatalogManifest } from '../catalog/reader.js';
const SAFETY_BUFFER = 2;
function countInstallablePrompts(manifest) {
    return manifest.agents
        .filter((agent) => agent.status === 'active' || agent.status === 'internal')
        .length;
}
function countInstallableSkills(manifest) {
    return manifest.skills
        .filter((skill) => skill.status === 'active' || skill.status === 'internal')
        .length;
}
export function getCatalogExpectations() {
    const manifest = tryReadCatalogManifest();
    if (!manifest) {
        return { promptMin: 25, skillMin: 30 };
    }
    const installablePromptCount = countInstallablePrompts(manifest);
    const installableSkillCount = countInstallableSkills(manifest);
    return {
        promptMin: Math.max(1, installablePromptCount - SAFETY_BUFFER),
        skillMin: Math.max(1, installableSkillCount - SAFETY_BUFFER),
    };
}
export function getCatalogHeadlineCounts() {
    const manifest = tryReadCatalogManifest();
    if (!manifest)
        return null;
    return {
        prompts: countInstallablePrompts(manifest),
        skills: countInstallableSkills(manifest),
    };
}
//# sourceMappingURL=catalog-contract.js.map