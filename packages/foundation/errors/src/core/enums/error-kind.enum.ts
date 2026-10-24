/**
 * Stackra file contract:
 * Purpose: `ErrorKind`, the ten kinds a refusal takes (`Refusal({ kind: ErrorKind.NotFound })`), each carrying its
 *          envelope category, its HTTP status and whether a refusal of that kind is retryable by default.
 * Boundary: an `Enum.of` value plus the type of the same name. The ten kinds are the ten categories of ADR 0140; only
 *           `FailedPrecondition` (code `failed_precondition`) reports a category spelled differently,
 *           `precondition_failed`, as the committed manifests record. A new kind is an ADR change (0140). The status
 *           table is the one gen's transport mapping reads; nothing writes a status by hand.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (decisions 2 and 3, as amended by 0294), ADR 0232, ADR 0294 (decision 16), ADR 0231
 *                     (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * The kinds of a refusal. Read a kind's data with `Enum.meta(ErrorKind, kind)`.
 *
 * @example
 * Enum.meta(ErrorKind, ErrorKind.FailedPrecondition); // { category: "precondition_failed", httpStatus: 412, retryable: false }
 */
export const ErrorKind = Enum.of({
  /** The input broke a field rule; the envelope's `fieldErrors` name the fields. */
  Validation: ["validation", { category: "validation", httpStatus: 400, retryable: false }],
  /** No verified caller; signing in may change the answer. */
  Unauthenticated: [
    "unauthenticated",
    { category: "unauthenticated", httpStatus: 401, retryable: false },
  ],
  /** The tenant is not entitled to a runtime-gated feature (0139). */
  EntitlementRequired: [
    "entitlement_required",
    { category: "entitlement_required", httpStatus: 402, retryable: false },
  ],
  /** The caller may not do this. */
  Forbidden: ["forbidden", { category: "forbidden", httpStatus: 403, retryable: false }],
  /** Nothing the caller may see has this reference. */
  NotFound: ["not_found", { category: "not_found", httpStatus: 404, retryable: false }],
  /** The state of a record forbids the change. */
  Conflict: ["conflict", { category: "conflict", httpStatus: 409, retryable: false }],
  /** A precondition of the call does not hold. */
  FailedPrecondition: [
    "failed_precondition",
    { category: "precondition_failed", httpStatus: 412, retryable: false },
  ],
  /** Too many calls; retry after the limit resets. */
  RateLimited: ["rate_limited", { category: "rate_limited", httpStatus: 429, retryable: true }],
  /** A dependency is down or timed out; a retry may succeed. */
  Unavailable: ["unavailable", { category: "unavailable", httpStatus: 503, retryable: true }],
  /** A bug; never the caller's fault. */
  Internal: ["internal", { category: "internal", httpStatus: 500, retryable: false }],
});

/** One of the codes above. */
export type ErrorKind = Enum.Value<typeof ErrorKind>;
