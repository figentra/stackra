/**
 * Stackra file contract:
 * Purpose: `signReceiptToken(claims, privateKey)`, a receipt token: the claims as base64url JSON, a dot, and the
 *          Ed25519 signature of that first part, as base64url. The till or the receipts service signs; the QR code on
 *          the receipt carries the token.
 * Boundary: Web Crypto only. The private key is the signer's (a server secret, never on a gate); a gate holds only the
 *           public key (`verifyReceiptToken`).
 * Runtime: isomorphic
 * Governing contract: ADR 0429 (decision 2); RFC 8032 (Ed25519).
 */
import type { ReceiptTokenClaims } from "#contracts/types/receipt-token-claims.type";
import { base64Url } from "#core/functions/base64-url.function";

/**
 * Signs `claims` into a receipt token.
 *
 * @example
 * const token = await signReceiptToken({ receiptId: "rct_01J…", nodeId: "nod_01J…", issuedAt: Date.now() }, key);
 */
export async function signReceiptToken(
  claims: ReceiptTokenClaims,
  privateKey: CryptoKey,
): Promise<string> {
  const body = base64Url(new TextEncoder().encode(JSON.stringify(claims)));
  const signature = await crypto.subtle.sign("Ed25519", privateKey, new TextEncoder().encode(body));
  return `${body}.${base64Url(new Uint8Array(signature))}`;
}
