/**
 * Stackra file contract:
 * Purpose: `registerEntitlements`, how gen's generated entry tells the plan driver and the sources what it derived and
 *          locked: each entitlement class with its key and the action and query classes it gates.
 * Boundary: writes the process-wide registry; a later row for a class replaces the earlier one. Checks each row, so a
 *           wrong row fails at boot rather than on the first call.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 10, 20 and 22); the actions precedent (`registerActions`).
 */
import { kindOf } from "@stackra/container";

import { ENTITLEMENT_REGISTRY } from "#core/constants/entitlement-registry.constant";
import type { EntitlementRegistration } from "#core/types/entitlement-registration.type";

/**
 * Registers the derived identities of entitlements and the calls they gate.
 *
 * @throws TypeError when a row's class is not an entitlement, its key is empty, or a gate is not an action or a query.
 * @example
 * registerEntitlements([
 *   { type: ProductLimitEntitlement, key: "catalogue.product_limit", gates: [ProductOperations.Create] },
 * ]);
 */
export function registerEntitlements(rows: readonly EntitlementRegistration[]): void {
  for (const row of rows) {
    if (kindOf(row.type)?.kind !== "entitlement")
      throw new TypeError(`registerEntitlements: ${row.type.name} is not an entitlement`);
    if (typeof row.key !== "string" || row.key === "")
      throw new TypeError(`registerEntitlements: ${row.type.name} needs its locked key`);
    for (const gate of row.gates) {
      const kind = kindOf(gate)?.kind;
      if (kind !== "action" && kind !== "query")
        throw new TypeError(
          `registerEntitlements: ${row.key} gates ${gate.name}, which is not an action or a query`,
        );
    }
    ENTITLEMENT_REGISTRY.set(
      row.type,
      Object.freeze({ ...row, gates: Object.freeze([...row.gates]) }),
    );
  }
}
