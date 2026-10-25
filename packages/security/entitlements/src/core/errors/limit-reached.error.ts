/**
 * Stackra file contract:
 * Purpose: `LimitReachedError`, the refusal of a call that would pass a limit the plan grants (`limit_reached`): the
 *          entitlement refusal REST clients and MCP tools surface with an upgrade path.
 * Boundary: raised by `PlanEntitlementCheckDriver` before `handle` runs; kind `EntitlementRequired` (HTTP 402), not
 *           retryable. Its details name the entitlement key and the granted count, both the caller's own plan; nothing
 *           about other scopes travels with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0215 (decision 3); ADR 0139 (the upgrade path); ADR 0155 and
 *                     0217 (MCP tools surface the entitlement refusal); final review R-02 (typed `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: only a plan change or fewer records alters the answer.
 *
 * @example
 * throw LimitReachedError.create({ entitlement: "catalogue.product_limit", limit: 2 });
 */
export class LimitReachedError extends Refusal({
  kind: ErrorKind.EntitlementRequired,
  retryable: false,
}) {
  /** The locked key of the limit (`catalogue.product_limit`). */
  entitlement!: string;

  /** How many the plan grants. */
  limit!: number;
}
