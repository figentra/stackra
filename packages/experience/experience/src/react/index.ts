/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/experience (the web `DocumentRenderer` and the `react`
 *          driver of the `Renderer` port, and the marketing blocks of the module UI kit, `FeatureSection` and
 *          `CtaSection`, ADR 0503) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The node drawing stays internal.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { CtaSection } from "#react/cta-section/cta-section";
export type { CtaSectionProps } from "#react/cta-section/cta-section.props";
export { DocumentRenderer } from "#react/document-renderer/document-renderer";
export type { DocumentRendererProps } from "#react/document-renderer/document-renderer.props";
export { ReactRendererDriver } from "#react/drivers/react-renderer.driver";
export { FeatureSection } from "#react/feature-section/feature-section";
export type { FeatureSectionProps } from "#react/feature-section/feature-section.props";
