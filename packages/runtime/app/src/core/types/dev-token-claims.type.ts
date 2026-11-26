/**
 * Stackra file contract:
 * Purpose: `DevTokenClaims`, what a dev token says about its caller (`mintDevToken`): the user's `usr_` id and realm
 *          and, optionally, the scope the token is issued for with the memberships it is one of, the permissions held
 *          there, an email and a name, plus how long it lives.
 * Boundary: a type only. The claims are the provider-neutral ones a ZITADEL token carries (`IDENTITY_CLAIMS`), so a
 *           dev token reaches `actorOf` and the scope chain exactly as a real one does.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decisions 2 and 3; amendment of 2026-11-26: the dev issuer).
 */
import type { Realm } from "@stackra/contracts";

/** The caller a dev token names. */
export interface DevTokenClaims {
  /** The user's `usr_` public id, also the token's `sub`. */
  readonly userId: string;

  /** The user's realm. */
  readonly realm: Realm;

  /** The `ltree` path of the scope the token is issued for; one of `memberships`. */
  readonly scopePath?: string;

  /** The user's memberships: each scope node's `scp_` id, path, name and role codes. */
  readonly memberships?: readonly {
    readonly scopeId: string;
    readonly path: string;
    readonly name: string;
    readonly roles: readonly string[];
  }[];

  /** The permission names held in `scopePath`. */
  readonly permissions?: readonly string[];

  /** The user's email. */
  readonly email?: string;

  /** The user's display name. */
  readonly name?: string;

  /** Seconds the token lives, 1 to 86,400; one hour by default. */
  readonly ttlSeconds?: number;

  /** The issue time; now by default. */
  readonly now?: Date;
}
