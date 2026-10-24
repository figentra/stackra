/**
 * Stackra file contract:
 * Purpose: `ENTITLEMENT_REGISTRY`, the rows `registerEntitlements` stored, by entitlement class.
 * Boundary: process-wide and internal: written by `registerEntitlements`, read by `entitlementKey` and
 *           `PlanEntitlementCheckDriver`. A later row for the same class replaces the earlier one.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22).
 */
import type { EntitlementClass } from "#core/types/entitlement-class.type";
import type { EntitlementRegistration } from "#core/types/entitlement-registration.type";

/** Entitlement class to its registered key and gates. */
export const ENTITLEMENT_REGISTRY = new Map<EntitlementClass, EntitlementRegistration>();
