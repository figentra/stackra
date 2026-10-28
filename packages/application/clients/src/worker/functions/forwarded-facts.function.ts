/**
 * Stackra file contract:
 * Purpose: `forwardedFacts`, the headers a Worker forwards from the visitor's request to the gateway: its W3C
 *          `traceparent` (one trace from the edge to the services), its `Sec-Purpose` (a prefetch is not a visit), and
 *          the visitor's address signed with HMAC-SHA256 as `Stackra-Visitor`.
 * Boundary: `Stackra-Visitor` is `<address>;<unix seconds>;<base64url HMAC-SHA256 of "<address>;<unix seconds>">`; the
 *           gateway verifies the signature and the age before it uses the address, so a client cannot set it. The
 *           address is Cloudflare's `CF-Connecting-IP`; without it no visitor header is sent. A header the request
 *           lacks is not forwarded.
 * Runtime: worker
 * Governing contract: ADR 0237 (generated gateway); ADR 0184 (trace context); ADR 0284 (Workers).
 */
import type { ForwardedFactsOptions } from "#worker/types/forwarded-facts-options.type";

/** The bytes as unpadded base64url. */
function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCodePoint(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * The facts of `request` to forward.
 *
 * @throws RangeError when `signingKey` is empty.
 * @example
 * createPublicClients({ ..., forward: forwardedFacts(request, { signingKey: env.visitorSigningKey }) });
 */
export async function forwardedFacts(
  request: Request,
  options: ForwardedFactsOptions,
): Promise<Readonly<Record<string, string>>> {
  if (options.signingKey === "")
    throw new RangeError("forwardedFacts needs a signing key for the visitor's address");
  const facts: Record<string, string> = {};
  const traceparent = request.headers.get("traceparent");
  if (traceparent !== null) facts["traceparent"] = traceparent;
  const purpose = request.headers.get("Sec-Purpose");
  if (purpose !== null) facts["Sec-Purpose"] = purpose;
  const address = request.headers.get("CF-Connecting-IP");
  if (address !== null) {
    const encoder = new TextEncoder();
    const signed = `${address};${Math.floor(Date.now() / 1000)}`;
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(options.signingKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signed));
    facts["Stackra-Visitor"] = `${signed};${base64url(new Uint8Array(signature))}`;
  }
  return Object.freeze(facts);
}
