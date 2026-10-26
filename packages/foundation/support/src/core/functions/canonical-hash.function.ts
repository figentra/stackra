/**
 * Stackra file contract:
 * Purpose: `canonicalHash`, the SHA-256 of a value's canonical JSON as 64 lowercase hex characters: the one hash of a
 *          chain link, a checkpoint or a proof bundle entry, so appending, verifying and an offline verifier never
 *          drift.
 * Boundary: pure apart from Web Crypto (`crypto.subtle`), so it runs in Node, a browser and a worker. The text hashed
 *           is `canonicalJson(value)` as UTF-8.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3: a hash chain); ADR 0416.
 */
import { canonicalJson } from "#core/functions/canonical-json.function";

/**
 * The SHA-256 of `value`'s canonical JSON, lowercase hex.
 *
 * @example
 * const hash = await canonicalHash({ sequence: 1, previousHash: "0".repeat(64), key: "orders.order.place" });
 */
export async function canonicalHash(value: unknown): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonicalJson(value)),
  );
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
