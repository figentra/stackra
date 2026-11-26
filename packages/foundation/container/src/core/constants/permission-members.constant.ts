/**
 * Stackra file contract:
 * Purpose: `PERMISSION_MEMBERS`, the name of the `Permission` static behind each registered locked key
 *          (`orders.order.confirm_by_code` → `confirmByCode`), so a record policy's method is found by the static's own
 *          name.
 * Boundary: process-wide and internal: written by `registerPermissions` beside `PERMISSION_REGISTRY`, read by the
 *           record-policy step. A later row for the same key replaces the earlier one. It lives on `globalThis` under a
 *           `Symbol.for` key, so two installed copies of this package share it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22); ADR 0132 (as amended by 0263: a policy method per verb).
 */

/** The process-wide key every copy of this package reads the map from. */
const KEY = Symbol.for("@stackra/container/permission-members");

/** Locked key to the name of its `Permission` static. */
export const PERMISSION_MEMBERS = ((globalThis as Record<symbol, unknown>)[KEY] ??= new Map<
  string,
  string
>()) as Map<string, string>;
