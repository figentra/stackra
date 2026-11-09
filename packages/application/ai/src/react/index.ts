/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/ai, the AI module UI kit (`ChatSurface` with its Props, part renderers and default renderers, and
 *          ADR 0507's Tamo provider, slot hook, settings resolver and offline mock client) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing; the block depends on
 *           @stackra/ui, never the reverse, and never reaches ./node (ADR 0504).
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { ChatSurface } from "#react/chat-surface/chat-surface";
export type { ChatSurfaceProps } from "#react/chat-surface/chat-surface.props";
export type { ChatPartRenderers } from "#react/chat-surface/chat-part-renderers.type";
export type { ChatPartOptions } from "#react/chat-surface/chat-part-options.type";
export { defaultChatPartRenderers } from "#react/chat-surface/default-chat-part-renderers.constant";
export { TamoProvider } from "#react/tamo/tamo-provider";
export type { TamoProviderProps } from "#react/tamo/tamo-provider.props";
export { useTamoSlot } from "#react/tamo/use-tamo-slot";
export { createMockTamoClient } from "#react/tamo/create-mock-tamo-client.function";
export type { MockTamoClientOptions } from "#react/tamo/mock-tamo-client-options.type";
export { resolveTamoEnabled } from "#react/tamo/resolve-tamo-enabled.function";
export type { TamoClient } from "#react/tamo/tamo-client.type";
export type { TamoRunContext } from "#react/tamo/tamo-run-context.type";
export type { TamoSetting } from "#react/tamo/tamo-setting.type";
export type { TamoSettings } from "#react/tamo/tamo-settings.type";
