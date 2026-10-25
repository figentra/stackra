/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/experience (the `Block` kind, `BlockCategory`, the `BlockProps`
 *          and `LocalizedText` types, the wiring's `registerBlocks`, the builder's read-only `registeredBlocks`, the
 *          document validator `resolveDocument` and its two refusals) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The registry state, the locale fallback, the props walk and the
 *           event dispatch stay internal; the renderers are `./react`'s and `./native`'s. `BlockProps` with `onEvent`
 *           is `./native`'s own type, a different declaration (registry A3).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { Block } from "#core/bases/block.base";
export { BlockCategory } from "#core/enums/block-category.enum";
export { InvalidDocumentError } from "#core/errors/invalid-document.error";
export { UnknownBlockError } from "#core/errors/unknown-block.error";
export { registerBlocks } from "#core/functions/register-blocks.function";
export { registeredBlocks } from "#core/functions/registered-blocks.function";
export { resolveDocument } from "#core/functions/resolve-document.function";
export type { BlockClass } from "#core/types/block-class.type";
export type { BlockEntry } from "#core/types/block-entry.type";
export type { BlockOptions } from "#core/types/block-options.type";
export type { BlockProps } from "#core/types/block-props.type";
export type { LocalizedText } from "#core/types/localized-text.type";
export type { ResolvedNode } from "#core/types/resolved-node.type";
