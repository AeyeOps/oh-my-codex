export const SETUP_ONLY_INSTALLABLE_SKILLS = new Set(['wiki']);
export function isCatalogInstallableStatus(status) {
    return status === 'active' || status === 'internal';
}
export function getSetupInstallableSkillNames(manifest) {
    return new Set([
        ...((manifest?.skills ?? [])
            .filter((skill) => isCatalogInstallableStatus(skill.status))
            .map((skill) => skill.name)),
        ...SETUP_ONLY_INSTALLABLE_SKILLS,
    ]);
}
//# sourceMappingURL=installable.js.map