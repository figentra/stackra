/**
 * Stackra file contract:
 * Purpose: `QuotaExceededError`, the refusal of a call whose quota entitlement's allowance for the current period is
 *          used up (`quota_exceeded`): the entitlement refusal REST clients and MCP tools surface with an upgrade path.
 * Boundary: raised by `PlanEntitlementCheckDriver` before `handle` runs; kind `EntitlementRequired` (HTTP 402), not
 *           retryable within the period. Its details name the entitlement key, the meter, the allowance and when the
 *           period resets, all the caller's own plan; nothing about other scopes travels with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0216 (decision 3: quotas); ADR 0139 (the upgrade path);
 *                     stackra-309.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: only the next period or a plan change alters the answer.
 *
 * @example
 * throw QuotaExceededError.create({ entitlement: "ai.token_quota", meter: "ai.tokens", limit: 100000, resetsAt });
 */
export class QuotaExceededError extends Refusal({
  kind: ErrorKind.EntitlementRequired,
  retryable: false,
}) {
  /** The locked key of the quota (`ai.token_quota`). */
  entitlement!: string;

  /** The meter it counts (`ai.tokens`). */
  meter!: string;

  /** How much the plan allows per period. */
  limit!: number;

  /** When the period ends and the quota resets, ISO 8601. */
  resetsAt!: string;
}
