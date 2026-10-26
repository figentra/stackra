/**
 * Stackra file contract:
 * Purpose: `fakeTenantId()`, a fresh, well-formed tenant id for a test, so tests stop spelling fixed ids.
 * Boundary: test helper; random, so two calls never collide. The id passes `isTenantId` but names no scope node: a
 *           test that needs the node creates it through the scope tree.
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (public ids); ADR 0269 (testing entries); OS audit SPEC gap 11.
 */
import type { PublicId } from "@stackra/contracts";

/** Crockford's base32 alphabet, lowercase, as public ids use. */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

/**
 * A new tenant id.
 *
 * @example
 * const tenantId = fakeTenantId(); // "scp_…"
 */
export function fakeTenantId(): PublicId<"scp"> {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(26));
  return `scp_${Array.from(bytes, (byte) => ALPHABET.charAt(byte % 32)).join("")}`;
}
