import { ADAPT_TARGETS, } from "./contracts.js";
function capability(id, label, ownership, status, summary) {
    return {
        id,
        label,
        ownership,
        status,
        summary,
    };
}
const FOUNDATION_CAPABILITIES = [
    capability("omx-adapter-paths", "OMX-owned adapter paths", "omx-owned", "ready", "Adapter artifacts stay under .omx/adapters/<target>/... rather than .omx/state or target internals."),
    capability("planning-artifact-linkage", "Planning artifact linkage", "shared-contract", "ready", "Envelope output links canonical OMX PRD/test-spec artifacts when they exist."),
    capability("foundation-reporting", "Foundation reporting surface", "shared-contract", "ready", "Probe, status, envelope, init, and doctor share a target-agnostic output contract."),
];
const TARGET_DESCRIPTORS = {
    openclaw: {
        target: "openclaw",
        displayName: "OpenClaw",
        summary: "OMX-owned adapter around existing OpenClaw notification, gateway, and lifecycle observation surfaces.",
        followupHint: "Status reflects local OpenClaw config/env/gateway evidence only; remote acknowledgement remains out of scope.",
        capabilities: [
            ...FOUNDATION_CAPABILITIES,
            capability("gateway-observation", "Gateway observation", "target-observed", "ready", "Local OpenClaw config/env/gateway evidence is observed through existing config and gateway resolution seams."),
            capability("lifecycle-bridge", "Lifecycle bridge metadata", "shared-contract", "ready", "Probe, status, and envelope surface the existing OMX to OpenClaw lifecycle mapping without claiming remote execution health."),
        ],
    },
    hermes: {
        target: "hermes",
        displayName: "Hermes",
        summary: "Foundation seam for an OMX-owned adapter around Hermes ACP, gateway, and persistent-session surfaces.",
        followupHint: "Hermes adapter reads external ACP, gateway, and session-store evidence while keeping all writes under .omx/adapters/hermes/.",
        capabilities: [
            ...FOUNDATION_CAPABILITIES,
            capability("persistent-session-observation", "Persistent session observation", "target-observed", "stub", "Hermes session-store evidence is read from HERMES_HOME-scoped state.db when available."),
            capability("acp-envelope-bridge", "ACP envelope bridge", "shared-contract", "stub", "Hermes envelope/bootstrap metadata maps OMX lifecycle intent into ACP and gateway guidance without claiming deep control."),
        ],
    },
};
export function listAdaptTargets() {
    return ADAPT_TARGETS.map((target) => TARGET_DESCRIPTORS[target]);
}
export function getAdaptTargetDescriptor(target) {
    return Object.hasOwn(TARGET_DESCRIPTORS, target)
        ? TARGET_DESCRIPTORS[target]
        : null;
}
//# sourceMappingURL=registry.js.map