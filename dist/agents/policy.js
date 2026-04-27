export const NON_NATIVE_AGENT_PROMPT_ASSETS = new Set([
    "explore-harness",
    "sisyphus-lite",
    "team-orchestrator",
]);
export function isNativeAgentInstallableStatus(status) {
    return status === "active" || status === "internal";
}
export function getCatalogAgentStatusByName(manifest) {
    return new Map(manifest.agents.map((agent) => [agent.name, agent.status]));
}
export function getCatalogAgentByName(manifest) {
    return new Map(manifest.agents.map((agent) => [agent.name, agent]));
}
export function getInstallableNativeAgentNames(manifest) {
    return new Set(manifest.agents
        .filter((agent) => isNativeAgentInstallableStatus(agent.status))
        .map((agent) => agent.name));
}
export function getNonInstallableNativeAgentNames(manifest) {
    return new Set(manifest.agents
        .filter((agent) => !isNativeAgentInstallableStatus(agent.status))
        .map((agent) => agent.name));
}
export function isSetupPromptAssetName(promptName, manifest) {
    return (manifest.agents.some((agent) => agent.name === promptName) ||
        NON_NATIVE_AGENT_PROMPT_ASSETS.has(promptName));
}
export function assertNativeAgentCanonicalTargets(manifest) {
    const byName = getCatalogAgentByName(manifest);
    for (const agent of manifest.agents) {
        if (agent.status !== "alias" && agent.status !== "merged")
            continue;
        if (!agent.canonical) {
            throw new Error([
                "native_agent_canonical_invalid",
                `agent=${agent.name}`,
                "message=alias/merged native agents must declare a canonical target",
            ].join("\n"));
        }
        const canonical = byName.get(agent.canonical);
        if (!canonical) {
            throw new Error([
                "native_agent_canonical_invalid",
                `agent=${agent.name}`,
                `canonical=${agent.canonical}`,
                "message=canonical native agent target is not listed in the catalog",
            ].join("\n"));
        }
        if (!isNativeAgentInstallableStatus(canonical.status)) {
            throw new Error([
                "native_agent_canonical_invalid",
                `agent=${agent.name}`,
                `canonical=${agent.canonical}`,
                `canonical_status=${canonical.status}`,
                "message=canonical native agent target must be directly installable",
            ].join("\n"));
        }
    }
}
//# sourceMappingURL=policy.js.map