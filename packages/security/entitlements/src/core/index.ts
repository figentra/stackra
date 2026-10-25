/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/entitlements (the `Entitlement` kind, its ports, the plan driver
 *          of the pipeline's entitlement step, the registration gen calls and `LimitReachedError`) until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The registry stays internal. The ports are exported here: the
 *           registry row gives this package `.` and `./testing` only, so there is no `./contracts` entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { Entitlement } from "#core/bases/entitlement.base";
export { PlanEntitlementCheckDriver } from "#core/drivers/plan-entitlement-check.driver";
export { EntitlementKind } from "#core/enums/entitlement-kind.enum";
export { LimitReachedError } from "#core/errors/limit-reached.error";
export { entitlementKey } from "#core/functions/entitlement-key.function";
export { registerEntitlements } from "#core/functions/register-entitlements.function";
export { EntitlementSource } from "#core/ports/entitlement-source.port";
export { EntitlementUsage } from "#core/ports/entitlement-usage.port";
export type { EntitlementClass } from "#core/types/entitlement-class.type";
export type { EntitlementGrant } from "#core/types/entitlement-grant.type";
export type { EntitlementOptions } from "#core/types/entitlement-options.type";
export type { EntitlementRegistration } from "#core/types/entitlement-registration.type";
