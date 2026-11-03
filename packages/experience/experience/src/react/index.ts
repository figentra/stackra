/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/experience (the web `DocumentRenderer` and the `react`
 *          driver of the `Renderer` port, the marketing blocks of the module UI kit, `FeatureSection` and
 *          `CtaSection`, ADR 0504, and the thirteen blocks of the Stackra landing, STA-2041) until `stackra gen` writes
 *          the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The node drawing stays internal.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { AskAiBlock } from "#react/ask-ai-block/ask-ai-block";
export type { AskAiBlockProps } from "#react/ask-ai-block/ask-ai-block.props";
export { BentoGridBlock } from "#react/bento-grid-block/bento-grid-block";
export type { BentoGridBlockProps } from "#react/bento-grid-block/bento-grid-block.props";
export { ChapterTitleBlock } from "#react/chapter-title-block/chapter-title-block";
export type { ChapterTitleBlockProps } from "#react/chapter-title-block/chapter-title-block.props";
export { CtaRowBlock } from "#react/cta-row-block/cta-row-block";
export type { CtaRowBlockProps } from "#react/cta-row-block/cta-row-block.props";
export { CtaSection } from "#react/cta-section/cta-section";
export type { CtaSectionProps } from "#react/cta-section/cta-section.props";
export { DocumentRenderer } from "#react/document-renderer/document-renderer";
export type { DocumentRendererProps } from "#react/document-renderer/document-renderer.props";
export { ReactRendererDriver } from "#react/drivers/react-renderer.driver";
export { FeatureSection } from "#react/feature-section/feature-section";
export type { FeatureSectionProps } from "#react/feature-section/feature-section.props";
export { HeroMachineBlock } from "#react/hero-machine-block/hero-machine-block";
export type { HeroMachineBlockProps } from "#react/hero-machine-block/hero-machine-block.props";
export { MonoDisplayBlock } from "#react/mono-display-block/mono-display-block";
export type { MonoDisplayBlockProps } from "#react/mono-display-block/mono-display-block.props";
export { ProductCardsBlock } from "#react/product-cards-block/product-cards-block";
export type { ProductCardsBlockProps } from "#react/product-cards-block/product-cards-block.props";
export { SiteFooterBlock } from "#react/site-footer-block/site-footer-block";
export type { SiteFooterBlockProps } from "#react/site-footer-block/site-footer-block.props";
export { SiteHeaderBlock } from "#react/site-header-block/site-header-block";
export type { SiteHeaderBlockProps } from "#react/site-header-block/site-header-block.props";
export { StatementBlock } from "#react/statement-block/statement-block";
export type { StatementBlockProps } from "#react/statement-block/statement-block.props";
export { StationBlock } from "#react/station-block/station-block";
export type { StationBlockProps } from "#react/station-block/station-block.props";
export { StepSwitcherBlock } from "#react/step-switcher-block/step-switcher-block";
export type { StepSwitcherBlockProps } from "#react/step-switcher-block/step-switcher-block.props";
export { TerminalDemoBlock } from "#react/terminal-demo-block/terminal-demo-block";
export type { TerminalDemoBlockProps } from "#react/terminal-demo-block/terminal-demo-block.props";
