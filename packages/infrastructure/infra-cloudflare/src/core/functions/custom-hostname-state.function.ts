/**
 * Stackra file contract:
 * Purpose: `customHostnameState(result)`, a Cloudflare custom hostname's report mapped onto the verification states of
 *          ADR 0276: hostname validation pending is `pending_ownership`, a validated hostname whose certificate is not
 *          live is `pending_certificate`, both live is `active`, and a blocked, moved, deleted or timed-out one is
 *          `failed`.
 * Boundary: pure. Cloudflare cannot see the scope's CNAME to the edge, so `pending_dns` is the tenancy service's own
 *           DNS check, and `removed` is its own record; this function never returns either.
 * Runtime: isomorphic
 * Governing contract: ADR 0276 (decisions 3 and 7; open detail 1), ADR 0437 (decision 10).
 */
import { CustomHostnameState } from "#core/enums/custom-hostname-state.enum";

/** Hostname statuses that end the attempt. */
const FAILED = new Set([
  "moved",
  "deleted",
  "pending_deletion",
  "blocked",
  "pending_blocked",
  "test_blocked",
  "test_failed",
]);

/** Certificate statuses that end the attempt. */
const CERTIFICATE_FAILED = new Set([
  "validation_timed_out",
  "issuance_timed_out",
  "deployment_timed_out",
  "deletion_timed_out",
  "expired",
  "deleted",
]);

/**
 * The verification state of the custom hostname Cloudflare reports as `result`.
 *
 * @param result - the `result` of `GET /zones/<zone>/custom_hostnames/<id>`: its `status` and `ssl.status`.
 * @example
 * customHostnameState({ status: "active", ssl: { status: "pending_validation" } }); // "pending_certificate"
 */
export function customHostnameState(result: {
  readonly status: string;
  readonly ssl?: { readonly status?: string | undefined } | null | undefined;
}): CustomHostnameState {
  const certificate = result.ssl?.status;
  if (
    FAILED.has(result.status) ||
    (certificate !== undefined && CERTIFICATE_FAILED.has(certificate))
  )
    return CustomHostnameState.Failed;
  if (result.status !== "active") return CustomHostnameState.PendingOwnership;
  return certificate === "active"
    ? CustomHostnameState.Active
    : CustomHostnameState.PendingCertificate;
}
