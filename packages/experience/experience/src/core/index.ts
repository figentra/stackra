/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/experience (the `Block` kind, `BlockCategory`, the `BlockProps`
 *          and `LocalizedText` types, the wiring's `registerBlocks`, the builder's read-only `registeredBlocks`, the
 *          document validator `resolveDocument` and its two refusals, the server-side `validateDocument` with
 *          `blockKinds`, and the section-based theme revisions `commitSiteTheme`, `rollbackSiteTheme`, `diffSiteTheme` and
 *          `validateSiteTheme`) until `stackra gen` writes the entry barrels (STA-339).
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
export { blockKinds } from "#core/functions/block-kinds.function";
export { commitSiteTheme } from "#core/functions/commit-site-theme.function";
export { diffSiteTheme } from "#core/functions/diff-site-theme.function";
export { registerBlocks } from "#core/functions/register-blocks.function";
export { registeredBlocks } from "#core/functions/registered-blocks.function";
export { resolveDocument } from "#core/functions/resolve-document.function";
export { rollbackSiteTheme } from "#core/functions/rollback-site-theme.function";
export { validateDocument } from "#core/functions/validate-document.function";
export { validateSiteTheme } from "#core/functions/validate-site-theme.function";
export type { BlockClass } from "#core/types/block-class.type";
export type { BlockEntry } from "#core/types/block-entry.type";
export type { BlockOptions } from "#core/types/block-options.type";
export type { BlockProps } from "#core/types/block-props.type";
export type { ResolvedNode } from "#core/types/resolved-node.type";
export type { SiteThemeChange } from "#core/types/site-theme-change.type";
export type { SiteThemeDiff } from "#core/types/site-theme-diff.type";
export type { SiteThemeRevision } from "#core/types/site-theme-revision.type";
export type { SiteTheme } from "#core/types/site-theme.type";
export type { ValidateDocumentOptions } from "#core/types/validate-document-options.type";
