/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/experience (the native `DocumentRenderer`, the `native`
 *          driver of the `Renderer` port and the native `BlockProps`, which adds `onEvent`) until `stackra gen` writes
 *          the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The node drawing stays internal.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export type { BlockProps } from "#native/block-props/block-props.type";
export { DocumentRenderer } from "#native/document-renderer/document-renderer";
export type { DocumentRendererProps } from "#native/document-renderer/document-renderer.props";
export { NativeRendererDriver } from "#native/drivers/native-renderer.driver";
