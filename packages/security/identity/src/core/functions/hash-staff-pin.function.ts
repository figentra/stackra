/**
 * Stackra file contract:
 * Purpose: `hashStaffPin`, the PBKDF2-SHA-256 hash of a staff PIN with a salt and an iteration count, base64url: what a
 *          shared device stores and checks offline instead of the PIN.
 * Boundary: Web Crypto only (`crypto.subtle`), so it runs on every target. The salt is bound into the hash, so the same
 *           PIN on two staff or two devices hashes apart. The iteration count is configuration.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 8); owner round 3 #15; OWASP password storage (PBKDF2-SHA-256).
 */
import { base64UrlOf } from "#core/functions/base64-url-of.function";

/**
 * The hash of `pin`.
 *
 * @example
 * const hash = await hashStaffPin("2468", salt, identity.pinHashIterations);
 */
export async function hashStaffPin(pin: string, salt: string, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations },
    key,
    256,
  );
  return base64UrlOf(new Uint8Array(bits));
}
