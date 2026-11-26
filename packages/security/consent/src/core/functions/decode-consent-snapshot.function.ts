/**
 * Stackra file contract:
 * Purpose: `decodeConsentSnapshot(token)`, a snapshot token split into its shape-checked payload, the signed bytes and
 *          the detached signature, or `null` when it is not a well-formed token.
 * Boundary: internal; never throws, so a forged or truncated header reads as `malformed`, never as an error. It checks
 *           nothing about trust: the verifier checks the key, the signature, the lifetime and the policy after this.
 *           The token form (8 KiB at most, three base64url segments) is `splitSignedToken`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decisions 2 and 4); ADR 0095 as amended (Zod at the boundary).
 */
import { CONSENT_SNAPSHOT_SCHEMA } from "#core/constants/consent-snapshot-schema.constant";
import { splitSignedToken } from "#core/functions/split-signed-token.function";
import type { DecodedConsentSnapshot } from "#core/types/decoded-consent-snapshot.type";

/**
 * The parts of `token`, or `null`.
 *
 * @example
 * const decoded = decodeConsentSnapshot(request.headers.get(CONSENT_SNAPSHOT_HEADER) ?? "");
 */
export function decodeConsentSnapshot(token: string): DecodedConsentSnapshot | null {
  const parts = splitSignedToken(token);
  if (parts === null) return null;
  const parsed = CONSENT_SNAPSHOT_SCHEMA.safeParse(parts.payload);
  if (!parsed.success) return null;
  return Object.freeze({
    snapshot: Object.freeze(parsed.data),
    message: parts.message,
    signature: parts.signature,
  });
}
