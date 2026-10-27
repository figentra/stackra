/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/entitlements (the `Entitlement` kind, its ports, the plan driver
 *          of the pipeline's entitlement step and its limit reservation, the value-entitlement reader, the registration
 *          gen calls, the by-class-or-key `isEntitled` check, the limit-grant helpers `isLimitGrant` and `limitOf`, `paidPlanDays`,
 *          `LimitReachedError`, the plan-catalogue admin of ADR 0391, and an edition's bundled catalogue `bundleEditionCatalogue`, ADR 0335) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The registry stays internal; `isLimitGrant` and `limitOf` are public
 *           (stackra-117) so a service's own ledger reuses them instead of repeating them.
 *           `EntitlementSource` now lives in `./contracts` and is still re-exported here so existing imports keep
 *           working; new code imports it from `./contracts`. `EntitlementKey` is re-exported
 *           the same way, for `./testing`, which imports `.` only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; stackra-117 (STA-1247); ADR 0335 (decision 6:
 *                     `bundleEditionCatalogue`, stackra-64).
 */
export { Entitlement } from "#core/bases/entitlement.base";
export { MemoryCatalogueVersionsDriver } from "#core/drivers/memory-catalogue-versions.driver";
export { MemoryPlanSnapshotsDriver } from "#core/drivers/memory-plan-snapshots.driver";
export { MemorySeatLedgerDriver } from "#core/drivers/memory-seat-ledger.driver";
export { PlanLimitReservationDriver } from "#core/drivers/plan-limit-reservation.driver";
export { PlanEntitlementCheckDriver } from "#core/drivers/plan-entitlement-check.driver";
export { PlanSnapshotEntitlementSourceDriver } from "#core/drivers/plan-snapshot-entitlement-source.driver";
export { EntitlementKind } from "#core/enums/entitlement-kind.enum";
export { CatalogueChangeBackdatedError } from "#core/errors/catalogue-change-backdated.error";
export { CatalogueVersionNotPendingError } from "#core/errors/catalogue-version-not-pending.error";
export { LimitReachedError } from "#core/errors/limit-reached.error";
export { SeatLimitReachedError } from "#core/errors/seat-limit-reached.error";
export { SecondApproverRequiredError } from "#core/errors/second-approver-required.error";
export { bundleEditionCatalogue } from "#core/functions/bundle-edition-catalogue.function";
export { entitlementKey } from "#core/functions/entitlement-key.function";
export { isEntitled } from "#core/functions/is-entitled.function";
export { isLimitGrant } from "#core/functions/is-limit-grant.function";
export { limitAllows } from "#core/functions/limit-allows.function";
export { limitOf } from "#core/functions/limit-of.function";
export { paidPlanDays } from "#core/functions/paid-plan-days.function";
export { planCatalogueOf } from "#core/functions/plan-catalogue-of.function";
export { registerEntitlements } from "#core/functions/register-entitlements.function";
export { tierPlan } from "#core/functions/tier-plan.function";
export { versionInForce } from "#core/functions/version-in-force.function";
export { EntitlementSource } from "#core/ports/entitlement-source.port";
export { EntitlementValueService } from "#core/services/entitlement-value.service";
export { LimitReservationService } from "#core/services/limit-reservation.service";
export { PlanCatalogueService } from "#core/services/plan-catalogue.service";
export { SeatMeterService } from "#core/services/seat-meter.service";
export type { CatalogueModule } from "#core/types/catalogue-module.type";
export type { CatalogueProposal } from "#core/types/catalogue-proposal.type";
export type { CatalogueSeedRecord } from "#core/types/catalogue-seed-record.type";
export type { EditionEntitlementBundle } from "#core/types/edition-entitlement-bundle.type";
export type { EntitlementClass } from "#core/types/entitlement-class.type";
export type { EntitlementKey } from "#contracts/types/entitlement-key.type";
export type { EntitlementGrant } from "#core/types/entitlement-grant.type";
export type { EntitlementOptions } from "#core/types/entitlement-options.type";
export type { EntitlementRegistration } from "#core/types/entitlement-registration.type";
export type { PlanCatalogue } from "#core/types/plan-catalogue.type";
export type { PlanTier } from "#core/types/plan-tier.type";
export type { SeatKind } from "#core/types/seat-kind.type";
export type { TrialTerms } from "#core/types/trial-terms.type";
