/**
 * OMX HUD - Statusline composer
 *
 * Renders HudRenderContext into formatted ANSI strings.
 */
import type { HudRenderContext, HudPreset } from './types.js';
export interface RenderHudOptions {
    maxWidth?: number;
    maxLines?: number;
}
/** Render the HUD statusline from context and preset */
export declare function renderHud(ctx: HudRenderContext, preset: HudPreset, options?: RenderHudOptions): string;
export declare function countRenderedHudLines(text: string): number;
//# sourceMappingURL=render.d.ts.map