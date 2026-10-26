/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/entitlements (the `Entitlement` kind, its ports, the plan driver
 *          of the pipeline's entitlement step and its limit reservation, the value-entitlement reader, the registration
 *          gen calls, `LimitReachedError`, and the plan-catalogue admin of ADR 0391) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The registry, `isLimitGrant` and `limitOf` stay internal.
 *           `EntitlementSource` now lives in `./contracts` and is still re-exported here so existing imports keep
 *           working; new code imports it from `./contracts`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
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
export { entitlementKey } from "#core/functions/entitlement-key.function";
export { limitAllows } from "#core/functions/limit-allows.function";
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
export type { EntitlementClass } from "#core/types/entitlement-class.type";
export type { EntitlementGrant } from "#core/types/entitlement-grant.type";
export type { EntitlementOptions } from "#core/types/entitlement-options.type";
export type { EntitlementRegistration } from "#core/types/entitlement-registration.type";
export type { PlanCatalogue } from "#core/types/plan-catalogue.type";
export type { PlanTier } from "#core/types/plan-tier.type";
export type { SeatKind } from "#core/types/seat-kind.type";
export type { TrialTerms } from "#core/types/trial-terms.type";
