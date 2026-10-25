/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/registry, which has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The shipped schema constants and the review transition table
 *           stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { CatalogueDiagnosticCode } from "#core/enums/catalogue-diagnostic-code.enum";
export { ReviewState } from "#core/enums/review-state.enum";
export { canTransitionReview } from "#core/functions/can-transition-review.function";
export { computePartnerPayout } from "#core/functions/compute-partner-payout.function";
export { planEditionInstall } from "#core/functions/plan-edition-install.function";
export { validateCatalogue } from "#core/functions/validate-catalogue.function";
export { AppReview } from "#core/schemas/app-review.schema";
export { CatalogueManifest } from "#core/schemas/catalogue-manifest.schema";
export { DeveloperSandbox } from "#core/schemas/developer-sandbox.schema";
export { EditionBundle } from "#core/schemas/edition-bundle.schema";
export { FeeSchedule } from "#core/schemas/fee-schedule.schema";
export { PartnerPayout } from "#core/schemas/partner-payout.schema";
export type { CatalogueDiagnostic } from "#core/types/catalogue-diagnostic.type";
export type { EditionInstallIssue } from "#core/types/edition-install-issue.type";
export type { EditionInstallPlan } from "#core/types/edition-install-plan.type";
export type { InstallableModule } from "#core/types/installable-module.type";
export type { PayoutAmounts } from "#core/types/payout-amounts.type";
