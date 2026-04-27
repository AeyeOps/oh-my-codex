/**
 * OpenClaw Gateway Dispatcher
 *
 * Sends instruction payloads to OpenClaw gateways via HTTP or CLI command.
 * All calls are non-blocking with timeouts. Failures are swallowed
 * to avoid blocking hooks.
 *
 * SECURITY: Command gateway requires OMX_OPENCLAW_COMMAND=1 opt-in.
 * Command timeout is configurable with safe bounds.
 * Prefers execFile for simple commands; falls back to sh -c only for shell metacharacters.
 */
import type { OpenClawCommandGatewayConfig, OpenClawGatewayConfig, OpenClawHttpGatewayConfig, OpenClawPayload, OpenClawResult } from "./types.js";
/**
 * Validate gateway URL. Must be HTTPS, except localhost/127.0.0.1/::1
 * which allows HTTP for local development.
 */
export declare function validateGatewayUrl(url: string): boolean;
/**
 * Interpolate template variables in an instruction string.
 *
 * Supported variables (from hook context):
 * - {{projectName}} - basename of project directory
 * - {{projectPath}} - full project directory path
 * - {{sessionId}} - session identifier
 * - {{prompt}} - prompt text
 * - {{contextSummary}} - context summary (session-end event)
 * - {{question}} - question text (ask-user-question event)
 * - {{timestamp}} - ISO timestamp
 * - {{event}} - hook event name
 * - {{instruction}} - interpolated instruction (for command gateway)
 * - {{replyChannel}} - originating channel (from OPENCLAW_REPLY_CHANNEL env var)
 * - {{replyTarget}} - reply target user/bot (from OPENCLAW_REPLY_TARGET env var)
 * - {{replyThread}} - reply thread ID (from OPENCLAW_REPLY_THREAD env var)
 *
 * Unresolved variables are replaced with empty string.
 */
export declare function interpolateInstruction(template: string, variables: Record<string, string | undefined>): string;
/**
 * Type guard: is this gateway config a command gateway?
 */
export declare function isCommandGateway(config: OpenClawGatewayConfig): config is OpenClawCommandGatewayConfig;
/**
 * Shell-escape a string for safe embedding in a shell command.
 * Uses single-quote wrapping with internal quote escaping.
 */
export declare function shellEscapeArg(value: string): string;
/**
 * Resolve command gateway timeout with precedence:
 * gateway timeout > OMX_OPENCLAW_COMMAND_TIMEOUT_MS > default.
 */
export declare function resolveCommandTimeoutMs(gatewayTimeout?: number, envTimeoutRaw?: string | undefined): number;
/**
 * Wake an HTTP-type OpenClaw gateway with the given payload.
 */
export declare function wakeGateway(gatewayName: string, gatewayConfig: OpenClawHttpGatewayConfig, payload: OpenClawPayload): Promise<OpenClawResult>;
/**
 * Wake a command-type OpenClaw gateway by executing a shell command.
 *
 * SECURITY REQUIREMENTS:
 * - Requires OMX_OPENCLAW_COMMAND=1 opt-in (separate gate from OMX_OPENCLAW)
 * - Timeout is configurable via gateway.timeout or OMX_OPENCLAW_COMMAND_TIMEOUT_MS
 *   with safe clamping bounds and backward-compatible default 5000ms
 * - Prefers execFile for simple commands (no metacharacters)
 * - Falls back to sh -c only when metacharacters detected
 * - detached: false to prevent orphan processes
 * - SIGTERM cleanup handler kills child on parent SIGTERM, 1s grace then SIGKILL
 *
 * The command template supports {{variable}} placeholders. All variable
 * values are shell-escaped before interpolation to prevent injection.
 */
export declare function wakeCommandGateway(gatewayName: string, gatewayConfig: OpenClawCommandGatewayConfig, variables: Record<string, string | undefined>): Promise<OpenClawResult>;
//# sourceMappingURL=dispatcher.d.ts.map