/**
 * Stackra file contract:
 * Purpose: `signVisitorToken(id, key)`, the signed form of a visitor's id an anonymous caller carries back:
 *          `v1.<anon id>.<base64url HMAC-SHA-256 over "v1.<anon id>">`.
 * Boundary: pure apart from Web Crypto; the key never leaves the process and the token holds no secret, only the id
 *           and its signature.
 * Runtime: node
 * Governing contract: ADR 0173 (secrets); STA-2025 (as amended 2026-11-09: one visitor id across requests).
 */
import type { PublicId } from "@stackra/contracts";

/**
 * Signs `id` with `key`.
 *
 * @param id - the visitor's `anon_` public id.
 * @param key - the current signing key (`VisitorOptions.signingKey`); never empty here.
 * @example
 * const token = await signVisitorToken("anon_01j9z3k4m5n6p7q8r9s0t1v2a1", key); // "v1.anon_….<signature>"
 */
export async function signVisitorToken(id: PublicId, key: string): Promise<string> {
  const payload = `v1.${id}`;
  const hmac = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", hmac, new TextEncoder().encode(payload));
  return `${payload}.${Buffer.from(signature).toString("base64url")}`;
}
