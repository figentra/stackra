/**
 * Stackra file contract:
 * Purpose: `ConsentRefusal`, why a call's consent reads as refused (ADR 0472 decision 4): no snapshot was sent, none
 *          could be checked, or the one sent is malformed, signed by a key the server does not trust, wrongly signed,
 *          not yet valid, expired, for an older consent policy, or records Global Privacy Control.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. `ctx.consent()` carries one of these
 *           when it is not verified; every reason means the same thing to a sender (nothing is sent), the code only
 *           says why, for logs and tests. Codes are snake_case machine codes (ADR 0231).
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decisions 3 and 4); ADR 0298 (decision 1, as amended); ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/**
 * The reasons a consent snapshot does not count.
 *
 * @example
 * const consent = await ctx.consent();
 * if (!consent.verified && consent.refusal === ConsentRefusal.Missing) logger.debug("old client: no snapshot");
 */
export const ConsentRefusal = Enum.of({
  /** The call carried no snapshot (an old client, a blocked request, an internal call). */
  Missing: "missing",
  /** No `ConsentCheck` is bound, so nothing could verify the snapshot. */
  Unchecked: "unchecked",
  /** The snapshot is not a well-formed signed snapshot. */
  Malformed: "malformed",
  /** The snapshot names a key id the server does not trust. */
  UntrustedKey: "untrusted_key",
  /** The signature does not verify with the trusted key. */
  BadSignature: "bad_signature",
  /** The snapshot was issued in the future (beyond the allowed clock skew). */
  NotYetValid: "not_yet_valid",
  /** The snapshot's lifetime is over. */
  Expired: "expired",
  /** The snapshot answers an older consent policy version. */
  PolicyOutdated: "policy_outdated",
  /** The snapshot records Global Privacy Control, which always refuses. */
  GlobalPrivacyControl: "global_privacy_control",
});

/** One of the codes above. */
export type ConsentRefusal = Enum.Value<typeof ConsentRefusal>;
