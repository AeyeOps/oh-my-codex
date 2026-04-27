/**
 * OpenClaw Integration - Public API
 *
 * Wakes OpenClaw gateways on hook events.
 * Most lifecycle events remain fire-and-forget, but callers may await
 * ask-user-question delivery so downstream reply routing stays attached.
 *
 * Usage (from notify hook via wakeOpenClaw):
 *   wakeOpenClaw("session-start", { sessionId, projectPath: directory });
 *
 * Activation requires OMX_OPENCLAW=1 env var and config in .omx-config.json.
 */
export type { OpenClawCommandGatewayConfig, OpenClawConfig, OpenClawContext, OpenClawGatewayConfig, OpenClawHookEvent, OpenClawHookMapping, OpenClawHttpGatewayConfig, OpenClawPayload, OpenClawResult, } from "./types.js";
export { getOpenClawConfig, resolveGateway, resetOpenClawConfigCache } from "./config.js";
export { wakeGateway, wakeCommandGateway, interpolateInstruction, isCommandGateway, shellEscapeArg, validateGatewayUrl, } from "./dispatcher.js";
import type { OpenClawHookEvent, OpenClawContext, OpenClawResult } from "./types.js";
/**
 * Wake the OpenClaw gateway mapped to a hook event.
 *
 * This is the main entry point called from the notify hook.
 * Errors are swallowed and null is returned when OpenClaw is not configured
 * or the event is not mapped.
 *
 * @param event - The hook event type
 * @param context - Context data for template variable interpolation
 * @returns OpenClawResult or null if not configured/mapped
 */
export declare function wakeOpenClaw(event: OpenClawHookEvent, context: OpenClawContext): Promise<OpenClawResult | null>;
//# sourceMappingURL=index.d.ts.map