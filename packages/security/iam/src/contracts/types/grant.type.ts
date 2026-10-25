/**
 * Stackra file contract:
 * Purpose: `Grant`, one role a principal holds at one scope node, with an optional expiry: the unit the decision point
 *          reads from a policy snapshot.
 * Boundary: a type only. The principal is the snapshot's own, so it is not repeated here. A grant applies at its node
 *           and every node below it (ADR 0208 decision 1); an expired grant counts for nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decisions 1 and 2); ADR 0327 (decision 7: grants name a node of the scope tree).
 */
import type { ScopeRef } from "@stackra/contracts";

/**
 * A role held at a scope node.
 *
 * @example
 * const grant: Grant = { role: "orders.order_clerk", scope: { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" } };
 */
export interface Grant {
  /** The role's key: a `SystemRole` code, a module role's locked key (`orders.order_clerk`) or a custom role's key. */
  readonly role: string;

  /** The node the grant is held at; it covers that node and every node below. */
  readonly scope: ScopeRef;

  /** When the grant stops counting; absent for a grant without an end. */
  readonly expiresAt?: Date;
}
