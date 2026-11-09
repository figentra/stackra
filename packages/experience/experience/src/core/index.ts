/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/experience (the `Block` kind, `BlockCategory`, the `BlockProps`
 *          and `LocalizedText` types, the wiring's `registerBlocks`, the builder's read-only `registeredBlocks`, the
 *          document validator `resolveDocument` and its two refusals, the server-side `validateDocument` with
 *          `blockKinds`, and the section-based theme revisions `commitSiteTheme`, `rollbackSiteTheme`, `diffSiteTheme` and
 *          `validateSiteTheme`, and the fifteen landing blocks of STA-2041, `SiteHeaderBlock` to `PageDockBlock`)
 *          until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The registry state, the locale fallback, the props walk and the
 *           event dispatch stay internal; the renderers are `./react`'s and `./native`'s. `BlockProps` with `onEvent`
 *           is `./native`'s own type, a different declaration (registry A3).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { Block } from "#core/bases/block.base";
export { AskAiBlock } from "#core/blocks/ask-ai/ask-ai.block";
export { BentoGridBlock } from "#core/blocks/bento-grid/bento-grid.block";
export { CapabilityMatrixBlock } from "#core/blocks/capability-matrix/capability-matrix.block";
export { ChapterTitleBlock } from "#core/blocks/chapter-title/chapter-title.block";
export { CtaRowBlock } from "#core/blocks/cta-row/cta-row.block";
export { HeroMachineBlock } from "#core/blocks/hero-machine/hero-machine.block";
export { LeadFormBlock } from "#core/blocks/lead-form/lead-form.block";
export { MonoDisplayBlock } from "#core/blocks/mono-display/mono-display.block";
export { PageDockBlock } from "#core/blocks/page-dock/page-dock.block";
export { ProductCardsBlock } from "#core/blocks/product-cards/product-cards.block";
export { SiteFooterBlock } from "#core/blocks/site-footer/site-footer.block";
export { SiteHeaderBlock } from "#core/blocks/site-header/site-header.block";
export { StatementBlock } from "#core/blocks/statement/statement.block";
export { StationBlock } from "#core/blocks/station/station.block";
export { StepSwitcherBlock } from "#core/blocks/step-switcher/step-switcher.block";
export { SurfacesBlock } from "#core/blocks/surfaces/surfaces.block";
export { TerminalStageBlock } from "#core/blocks/terminal-stage/terminal-stage.block";
export { BlockCategory } from "#core/enums/block-category.enum";
export { LEAD_FORM_ACTION } from "#core/constants/lead-form-action.constant";
export { CapabilityState } from "#core/enums/capability-state.enum";
export { LeadFieldType } from "#core/enums/lead-field-type.enum";
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
export type { CapabilityColumn } from "#core/types/capability-column.type";
export type { CapabilityRow } from "#core/types/capability-row.type";
export type { CapabilityStateLabels } from "#core/types/capability-state-labels.type";
export type { LeadConsent } from "#core/types/lead-consent.type";
export type { LeadField } from "#core/types/lead-field.type";
export type { LeadSubmission } from "#core/types/lead-submission.type";
export type { ResolvedNode } from "#core/types/resolved-node.type";
export type { SiteThemeChange } from "#core/types/site-theme-change.type";
export type { SiteThemeDiff } from "#core/types/site-theme-diff.type";
export type { SiteThemeRevision } from "#core/types/site-theme-revision.type";
export type { SiteTheme } from "#core/types/site-theme.type";
export type { ValidateDocumentOptions } from "#core/types/validate-document-options.type";
