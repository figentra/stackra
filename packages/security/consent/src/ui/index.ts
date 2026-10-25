/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./ui` entry of @stackra/consent (the cookie banner, the consent preferences, the
 *          legal page and the terms prompt, on `@stackra/ui`) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` and `./react`. Web only: it renders `@stackra/ui`'s
 *           web components, so `./react` (hooks only) stays free of a UI dependency.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 15); owner round 3 #29; the STA-347 stand-in barrel decision.
 */
export { ConsentBanner } from "#ui/consent-banner/consent-banner";
export type { ConsentBannerProps } from "#ui/consent-banner/consent-banner-props.type";
export { ConsentPreferences } from "#ui/consent-preferences/consent-preferences";
export { LegalPage } from "#ui/legal-page/legal-page";
export type { LegalPageProps } from "#ui/legal-page/legal-page-props.type";
export { TermsPrompt } from "#ui/terms-prompt/terms-prompt";
export type { TermsDocumentLink } from "#ui/terms-prompt/terms-document-link.type";
export type { TermsPromptProps } from "#ui/terms-prompt/terms-prompt-props.type";
