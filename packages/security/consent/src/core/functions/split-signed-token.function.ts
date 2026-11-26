/**
 * Stackra file contract:
 * Purpose: `splitSignedToken(token)`, the shared first step of reading a compact signed token of this package (a
 *          consent snapshot, a guardian sign-in attestation): its three base64url segments split into the parsed
 *          payload JSON, the signed bytes and the detached signature, or `null` when it is not well formed.
 * Boundary: internal; never throws. It checks the form only: each decoder shape-checks the payload with its own schema
 *           and the verifier checks the key and the signature after that. A token longer than 8 KiB, with other than
 *           three non-empty segments, with a segment that is not base64url, or whose payload or key id is not UTF-8 or
 *           whose payload is not JSON, is refused before anything reads it.
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decisions 2 and 4); ADR 0095 as amended (Zod at the boundary); STA-2818.
 */
import { base64url } from "@stackra/support";

import type { SplitSignedToken } from "#core/types/split-signed-token.type";

/** The longest token read; a real one is well under 1 KiB. */
const MAX_TOKEN_LENGTH = 8192;

/**
 * The parts of `token`, or `null`.
 *
 * @example
 * const parts = splitSignedToken(token);
 * const parsed = parts === null ? undefined : SCHEMA.safeParse(parts.payload);
 */
export function splitSignedToken(token: string): SplitSignedToken | null {
  if (token.length > MAX_TOKEN_LENGTH) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [payload = "", keyIdText = "", value = ""] = parts;
  if (payload === "" || keyIdText === "" || value === "") return null;
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    const parsed: unknown = JSON.parse(decoder.decode(base64url.decode(payload)));
    const keyId = decoder.decode(base64url.decode(keyIdText));
    base64url.decode(value);
    return Object.freeze({
      payload: parsed,
      message: new TextEncoder().encode(payload),
      signature: Object.freeze({ keyId, algorithm: "ES256" as const, value }),
    });
  } catch {
    return null;
  }
}
