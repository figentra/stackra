/**
 * Stackra file contract:
 * Purpose: `createDevIssuerKey`, a new dev issuer key pair (ECDSA P-256, `ES256`) as JWKs sharing one random `kid`,
 *          which `stackra dev` writes to the workspace's `.stackra/dev-issuer.json` the first time it runs a service.
 * Boundary: Web Crypto only (`crypto.subtle`), so it runs wherever the verifier does. The public half carries no
 *           private member (`d`), which `devIssuerKeys` checks again on the server side.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decision 8, amendment of 2026-11-26: the dev issuer); RFC 7517; RFC 7518 (ES256).
 */
import { DEV_ISSUER } from "#core/constants/dev-issuer.constant";
import type { DevIssuerKey } from "#core/types/dev-issuer-key.type";

/** The bytes of a `kid` (16 random bytes, hex). */
const KID_BYTES = 16;

/**
 * A fresh dev issuer key pair.
 *
 * @example
 * const key = await createDevIssuerKey();
 * env.STACKRA_DEV_ISSUER_KEYS = JSON.stringify({ keys: [key.publicKey] });
 */
export async function createDevIssuerKey(): Promise<DevIssuerKey> {
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
    "sign",
    "verify",
  ]);
  const kid = `stackra-dev-${Array.from(crypto.getRandomValues(new Uint8Array(KID_BYTES)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("")}`;
  const common = { kid, alg: DEV_ISSUER.algorithm, use: "sig" };
  const privateKey = { ...(await crypto.subtle.exportKey("jwk", pair.privateKey)), ...common };
  const publicKey = { ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), ...common };
  return { privateKey, publicKey };
}
