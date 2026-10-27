/**
 * Stackra file contract:
 * Purpose: `sha256Hex`: the SHA-256 hex of a token: what the registry stores instead of the token.
 * Boundary: pure Web Crypto; no I/O.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 8).
 */
import { toHex } from "#src/bytes/to-hex";

/**
 * The SHA-256 hex of a token: what the registry stores instead of the token.
 *
 * @example
 * await sha256Hex("stkp_…"); // "9f86d0…"
 */
export async function sha256Hex(text: string): Promise<string> {
  return toHex(
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))),
  );
}
