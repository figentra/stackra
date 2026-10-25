/**
 * Stackra file contract:
 * Purpose: `contentHash`, the SHA-256 of a pack's canonical JSON as 64 lowercase hex characters: what `signPack`
 *          signs and `verifyPack` recomputes.
 * Boundary: pure apart from Web Crypto (`crypto.subtle`), which every supported runtime provides.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 2).
 */
import { canonicalJson } from "#core/functions/canonical-json.function";

/**
 * The content hash of `value`.
 *
 * @example
 * await contentHash(pack); // "9f86d081…"
 */
export async function contentHash(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonicalJson(value)),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
