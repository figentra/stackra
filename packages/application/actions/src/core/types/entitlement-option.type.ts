/**
 * Stackra file contract:
 * Purpose: `EntitlementOption`, the value of an action's or query's `entitlement` option: one entitlement class or a
 *          list of them, each a class whose instances carry the entitlement brand.
 * Boundary: a type only. Typed structurally on the `"~kind": "entitlement"` brand because `@stackra/entitlements`
 *           depends on this package and cannot be imported here; gen lists the call in each entitlement's `gates`.
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decision 1); ADR 0216 (decision 3); ADR 0294 (decisions 16 and 20); STA-2059.
 */
import type { AnyClass } from "@stackra/container";

/** An entitlement class, recognised by its instance brand. */
type EntitlementClass = AnyClass<{ readonly "~kind": "entitlement" }>;

/** The entitlement a call needs a plan to grant: one class or a list. */
export type EntitlementOption = EntitlementClass | readonly EntitlementClass[];
