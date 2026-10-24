/**
 * Stackra file contract:
 * Purpose: `registerActions`, how gen's generated entry tells the pipeline the identities it derived and locked: each
 *          action and query class with its key, permission, risk and input schema class.
 * Boundary: writes the process-wide registry; a later row for a class replaces the earlier one. Checks that each row
 *           names an action or query class, so a wrong row fails at boot rather than on the first call.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 10, 20 and 22); the events precedent (`registerListeners`).
 */
import { kindOf } from "@stackra/container";

import { ACTION_REGISTRY } from "#core/constants/action-registry.constant";
import type { ActionRegistration } from "#core/types/action-registration.type";

/**
 * Registers the derived identities of actions and queries.
 *
 * @throws TypeError when a row's class is not an action or a query, or its key is empty.
 * @example
 * registerActions([
 *   { type: CreateOrderAction, key: "orders.order.create@1", permission: "orders.order.create", risk: "L1", input: CreateOrderInput },
 * ]);
 */
export function registerActions(rows: readonly ActionRegistration[]): void {
  for (const row of rows) {
    const kind = kindOf(row.type)?.kind;
    if (kind !== "action" && kind !== "query")
      throw new TypeError(`registerActions: ${row.type.name} is not an action or a query`);
    if (typeof row.key !== "string" || row.key === "")
      throw new TypeError(`registerActions: ${row.type.name} needs its locked key`);
    ACTION_REGISTRY.set(row.type, Object.freeze({ ...row }));
  }
}
