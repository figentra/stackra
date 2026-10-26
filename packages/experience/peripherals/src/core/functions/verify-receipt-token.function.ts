/**
 * Stackra file contract:
 * Purpose: `verifyReceiptToken(token, publicKey)`, the claims of a receipt token whose Ed25519 signature the public key
 *          accepts, or why it is refused: `malformed` (not two base64url parts of JSON claims) or `signature`.
 * Boundary: Web Crypto only; checks the signature and the claims' shape, nothing else: age, node and reuse are the
 *           gate's (`ExitGateService`). Never throws on untrusted input.
 * Runtime: isomorphic
 * Governing contract: ADR 0429 (decision 2); RFC 8032 (Ed25519).
 */
import type { ReceiptTokenClaims } from "#contracts/types/receipt-token-claims.type";
import { fromBase64Url } from "#core/functions/from-base64-url.function";

/** Whether `value` has the claims' shape. */
const isClaims = (value: unknown): value is ReceiptTokenClaims => {
  if (typeof value !== "object" || value === null) return false;
  const claims = value as Record<string, unknown>;
  return (
    typeof claims["receiptId"] === "string" &&
    claims["receiptId"] !== "" &&
    typeof claims["nodeId"] === "string" &&
    typeof claims["issuedAt"] === "number" &&
    Number.isFinite(claims["issuedAt"])
  );
};

/**
 * Verifies a receipt token.
 *
 * @example
 * const checked = await verifyReceiptToken(scanned, gateKey);
 * if (checked.ok) admit(checked.claims);
 */
export async function verifyReceiptToken(
  token: string,
  publicKey: CryptoKey,
): Promise<
  | { readonly ok: true; readonly claims: ReceiptTokenClaims }
  | { readonly ok: false; readonly reason: "malformed" | "signature" }
> {
  const parts = token.trim().split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [body = "", signed = ""] = parts;
  const json = fromBase64Url(body);
  const signature = fromBase64Url(signed);
  if (json === null || signature === null) return { ok: false, reason: "malformed" };
  let claims: unknown;
  try {
    claims = JSON.parse(new TextDecoder().decode(json));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!isClaims(claims)) return { ok: false, reason: "malformed" };
  const isValid = await crypto.subtle
    .verify("Ed25519", publicKey, signature, new TextEncoder().encode(body))
    .catch(() => false);
  return isValid ? { ok: true, claims } : { ok: false, reason: "signature" };
}
