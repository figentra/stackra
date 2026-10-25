/**
 * Stackra file contract:
 * Purpose: `PipelineStage`, the named steps of the fixed action pipeline, in their one order: tenancy, permission,
 *          precondition, entitlement, flag, idempotency, rate limit, interceptors, then `handle`.
 * Boundary: an enum (`Enum.of`) whose source order is the order (`Enum.values(PipelineStage)`); `ActionPipeline` runs
 *           its steps in exactly this order, and nothing reorders it. Rate limit sits after idempotency so a replayed
 *           key costs no token. Per-device order (ADR 0338 decision 1) is no stage: it wraps them all, like the audit.
 * Runtime: isomorphic
 * Governing contract: ADR 0138 (as amended by 0294: the order is fixed); ADR 0305 (rule 24: interceptors between
 *                     idempotency and `handle`); ADR 0217 (decision 2: limits enforced in the pipeline).
 */
import { Enum } from "@stackra/contracts";

/**
 * The steps of the action pipeline, in order.
 *
 * @example
 * Enum.values(PipelineStage); // ["tenancy", "permission", "precondition", ...]
 */
export const PipelineStage = Enum.of({
  /** The tenant may act now (`TenancyCheck`). */
  Tenancy: "tenancy",
  /** The actor kind is allowed and holds the permission (`AccessControl.require`). */
  Permission: "permission",
  /** Each declared precondition holds (actions only). */
  Precondition: "precondition",
  /** The tenant's plan covers the call (`EntitlementCheck`). */
  Entitlement: "entitlement",
  /** No flag switches the call off (`FlagCheck`). */
  Flag: "flag",
  /** The input is valid, a repeated Idempotency-Key replays, a device's call keeps to its `offline.cap` (actions). */
  Idempotency: "idempotency",
  /** The area's and the action's token buckets allow the call. */
  RateLimit: "rate_limit",
  /** The declared interceptors wrap the call, first outermost. */
  Interceptors: "interceptors",
  /** `handle` runs, in the unit of work for an action, with the `accepts` review of an offline-computed document. */
  Handle: "handle",
});

/** One of the values above. */
export type PipelineStage = Enum.Value<typeof PipelineStage>;
