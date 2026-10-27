/**
 * Stackra file contract:
 * Purpose: `signEdgeRequest`, the one place the bytes of an edge signature are fixed: the HMAC-SHA256 of the
 *          `EdgeSignatureInput` fields joined by newlines in a fixed order, base64url. The edge Worker signs with it
 *          and the API's edge-header guard recomputes it, so the two sides cannot drift.
 * Boundary: a pure function over Web Crypto, so it runs in a Worker and in Node alike. Field order: scope (empty on a
 *           platform host), product, surface, realm, request id, timestamp, method (upper case), path, body hash.
 *           Header values cannot hold a newline, so the join is unambiguous. The secret is never logged.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (decision 4: the HMAC covers the identity headers, the timestamp, the method, the path,
 *                     a body hash and the request id).
 */
import type { EdgeSignatureInput } from "#contracts/types/edge-signature-input.type";

/**
 * The base64url HMAC-SHA256 of `input` under `secret`.
 *
 * @example
 * headers.set(EdgeHeader.Signature, await signEdgeRequest(input, secret));
 */
export async function signEdgeRequest(input: EdgeSignatureInput, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const bytes = [
    input.scope ?? "",
    input.product,
    input.surface,
    input.realm,
    input.requestId,
    String(input.timestamp),
    input.method.toUpperCase(),
    input.path,
    input.bodyHash,
  ].join("\n");
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(bytes)));
  return btoa(String.fromCharCode(...mac))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}
