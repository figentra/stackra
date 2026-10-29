/**
 * Stackra file contract:
 * Purpose: `verifyZitadelSignature`, whether a ZITADEL Actions v2 call is authentic: its `ZITADEL-Signature` header
 *          (`t=<unix seconds>,v1=<hex>`, one `v1` per active signing key) holds an HMAC-SHA256 of `<t>.<raw body>`
 *          under the target's signing key, made within the tolerance of `now`.
 * Boundary: pure over Web Crypto; `crypto.subtle.verify` compares in constant time. An empty key, a missing or
 *           malformed header, a stale or future timestamp beyond the tolerance (replay), or no matching `v1` is
 *           `false`. The body is the bytes as received, never re-serialised JSON.
 * Runtime: isomorphic
 * Governing contract: ZITADEL Actions v2 (target signing, `pkg/actions/signing.go`); ADR 0224 as amended (verify
 *                     before parse); STA-1579.
 */

/** How far the signed time may be from `now`: ZITADEL's own default tolerance. */
const TOLERANCE_SECONDS = 300;

/** The bytes of a hex text, or undefined when it is not hex of whole bytes. */
function hexBytes(hex: string): Uint8Array<ArrayBuffer> | undefined {
  if (!/^(?:[\da-f]{2})+$/i.test(hex)) return undefined;
  return Uint8Array.from(hex.match(/../g) ?? [], (pair) => Number.parseInt(pair, 16));
}

/**
 * Whether `header` signs `body` under `signingKey`.
 *
 * @param header - the `ZITADEL-Signature` header, or null when absent.
 * @param body - the raw request body.
 * @param signingKey - the target's signing key.
 * @param now - the current time, in milliseconds.
 * @example
 * if (!(await verifyZitadelSignature(request.headers.get("zitadel-signature"), body, key, Date.now()))) return 401;
 */
export async function verifyZitadelSignature(
  header: string | null,
  body: string,
  signingKey: string,
  now: number,
): Promise<boolean> {
  if (header === null || signingKey === "") return false;
  const parts = header.split(",").map((part) => part.trim().split("=", 2) as [string, string?]);
  const t = parts.find(([name]) => name === "t")?.[1];
  if (t === undefined || !/^\d{1,12}$/.test(t)) return false;
  if (Math.abs(now / 1000 - Number(t)) > TOLERANCE_SECONDS) return false;
  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(signingKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const signed = encoder.encode(`${t}.${body}`);
  for (const [name, value] of parts) {
    const signature = name === "v1" && value !== undefined ? hexBytes(value) : undefined;
    if (
      signature !== undefined &&
      (await globalThis.crypto.subtle.verify("HMAC", key, signature, signed))
    )
      return true;
  }
  return false;
}
