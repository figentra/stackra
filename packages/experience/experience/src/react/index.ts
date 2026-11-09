/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/experience (the web `DocumentRenderer` and the `react`
 *          driver of the `Renderer` port, the marketing blocks of the module UI kit, `FeatureSection` and
 *          `CtaSection`, ADR 0504, and the fifteen blocks of the Stackra landing, STA-2041) until `stackra gen` writes
 *          the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The node drawing, the ruled band and the surface frame stay
 *           internal.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { AskAi } from "#react/ask-ai/ask-ai";
export type { AskAiProps } from "#react/ask-ai/ask-ai.props";
export { BentoGrid } from "#react/bento-grid/bento-grid";
export type { BentoGridProps } from "#react/bento-grid/bento-grid.props";
export { CapabilityMatrix } from "#react/capability-matrix/capability-matrix";
export type { CapabilityMatrixProps } from "#react/capability-matrix/capability-matrix.props";
export { ChapterTitle } from "#react/chapter-title/chapter-title";
export type { ChapterTitleProps } from "#react/chapter-title/chapter-title.props";
export { CtaRow } from "#react/cta-row/cta-row";
export type { CtaRowProps } from "#react/cta-row/cta-row.props";
export { CtaSection } from "#react/cta-section/cta-section";
export type { CtaSectionProps } from "#react/cta-section/cta-section.props";
export { DocumentRenderer } from "#react/document-renderer/document-renderer";
export type { DocumentRendererProps } from "#react/document-renderer/document-renderer.props";
export { ReactRendererDriver } from "#react/drivers/react-renderer.driver";
export { FeatureSection } from "#react/feature-section/feature-section";
export type { FeatureSectionProps } from "#react/feature-section/feature-section.props";
export { HeroMachine } from "#react/hero-machine/hero-machine";
export type { HeroMachineProps } from "#react/hero-machine/hero-machine.props";
export { LeadForm } from "#react/lead-form/lead-form";
export type { LeadFormProps } from "#react/lead-form/lead-form.props";
export { MonoDisplay } from "#react/mono-display/mono-display";
export type { MonoDisplayProps } from "#react/mono-display/mono-display.props";
export { PageDock } from "#react/page-dock/page-dock";
export type { PageDockProps } from "#react/page-dock/page-dock.props";
export { ProductCards } from "#react/product-cards/product-cards";
export type { ProductCardsProps } from "#react/product-cards/product-cards.props";
export { SiteFooter } from "#react/site-footer/site-footer";
export type { SiteFooterProps } from "#react/site-footer/site-footer.props";
export { SiteHeader } from "#react/site-header/site-header";
export type { SiteHeaderProps } from "#react/site-header/site-header.props";
export { Statement } from "#react/statement/statement";
export type { StatementProps } from "#react/statement/statement.props";
export { Station } from "#react/station/station";
export type { StationProps } from "#react/station/station.props";
export { StepSwitcher } from "#react/step-switcher/step-switcher";
export type { StepSwitcherProps } from "#react/step-switcher/step-switcher.props";
export { Surfaces } from "#react/surfaces/surfaces";
export type { SurfacesProps } from "#react/surfaces/surfaces.props";
export { TerminalStage } from "#react/terminal-stage/terminal-stage";
export type { TerminalStageProps } from "#react/terminal-stage/terminal-stage.props";
