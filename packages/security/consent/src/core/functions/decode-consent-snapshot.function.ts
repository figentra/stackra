/**
 * Stackra file contract:
 * Purpose: `decodeConsentSnapshot(token)`, a snapshot token split into its shape-checked payload, the signed bytes and
 *          the detached signature, or `null` when it is not a well-formed token.
 * Boundary: internal; never throws, so a forged or truncated header reads as `malformed`, never as an error. It checks
 *           nothing about trust: the verifier checks the key, the signature, the lifetime and the policy after this.
 *           A token longer than 8 KiB is refused before decoding.
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decisions 2 and 4); ADR 0095 as amended (Zod at the boundary).
 */
import { base64url } from "@stackra/support";

import { CONSENT_SNAPSHOT_SCHEMA } from "#core/constants/consent-snapshot-schema.constant";
import type { DecodedConsentSnapshot } from "#core/types/decoded-consent-snapshot.type";

/** The longest token read; a real one is well under 1 KiB. */
const MAX_TOKEN_LENGTH = 8192;

/**
 * The parts of `token`, or `null`.
 *
 * @example
 * const decoded = decodeConsentSnapshot(request.headers.get(CONSENT_SNAPSHOT_HEADER) ?? "");
 */
export function decodeConsentSnapshot(token: string): DecodedConsentSnapshot | null {
  if (token.length > MAX_TOKEN_LENGTH) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [payload = "", keyIdText = "", value = ""] = parts;
  if (payload === "" || keyIdText === "" || value === "") return null;
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    const parsed = CONSENT_SNAPSHOT_SCHEMA.safeParse(
      JSON.parse(decoder.decode(base64url.decode(payload))),
    );
    if (!parsed.success) return null;
    const keyId = decoder.decode(base64url.decode(keyIdText));
    base64url.decode(value);
    return Object.freeze({
      snapshot: Object.freeze(parsed.data),
      message: new TextEncoder().encode(payload),
      signature: Object.freeze({ keyId, algorithm: "ES256" as const, value }),
    });
  } catch {
    return null;
  }
}
