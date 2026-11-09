/**
 * Stackra file contract:
 * Purpose: `VisitorIdentity`, who an anonymous call's visitor is and, when the answer must carry it back, the signed
 *          token and the cookie that do.
 * Boundary: a type only; `VisitorIdentityService#resolve` makes it and `serveGuardedCall` reads it.
 * Runtime: node
 * Governing contract: STA-2025 (as amended 2026-11-09).
 */
import type { PublicId } from "@stackra/contracts";

/** One anonymous call's visitor. */
export interface VisitorIdentity {
  /** The visitor's `anon_` id: the same on every call while the visitor carries its token back. */
  readonly id: PublicId;

  /**
   * Set when the answer must carry the visitor back: a new visitor, or one signed with the previous key. `token` goes
   * in the response header named `header`, and `cookie` is the whole `Set-Cookie` value.
   */
  readonly issue?: { readonly header: string; readonly token: string; readonly cookie: string };
}
