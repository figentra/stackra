/**
 * Stackra file contract:
 * Purpose: `CustomHostnameState`, the verification states of a scope's custom hostname (ADR 0276 open detail 1), as
 *          snake_case machine codes the tenancy `domains` module stores and the console shows.
 * Boundary: an `Enum.of` value plus the type of the same name. `customHostnameState` maps Cloudflare's report onto the
 *           states Cloudflare can see; `pending_dns` (the CNAME to the edge) and `removed` are decided by the tenancy
 *           service's own checks.
 * Runtime: isomorphic
 * Governing contract: ADR 0276 (decisions 2, 3 and 7; open detail 1), ADR 0437 (decision 10), ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** One case per verification state, in the order a hostname moves through them. */
export const CustomHostnameState = Enum.of({
  /** The ownership TXT record is not verified yet. */
  PendingOwnership: "pending_ownership",
  /** Ownership is proven; the CNAME to the edge is missing. */
  PendingDns: "pending_dns",
  /** The certificate is being validated, issued or deployed. */
  PendingCertificate: "pending_certificate",
  /** The hostname serves over TLS. */
  Active: "active",
  /** Verification, issuance or re-verification failed; the hostname does not serve. */
  Failed: "failed",
  /** The scope removed the hostname; its Cloudflare custom hostname is deleted. */
  Removed: "removed",
});

/** One of the codes above. */
export type CustomHostnameState = Enum.Value<typeof CustomHostnameState>;
