/**
 * Stackra file contract:
 * Purpose: `DevIssuerState`, the content of a workspace's `.stackra/dev-issuer.json`: the dev issuer's key pair and
 *          the seeded dev user every `stackra dev token` names unless told otherwise.
 * Boundary: a type only; `ensureDevIssuer` writes and checks it.
 * Runtime: node
 * Governing contract: ADR 0206 (amendment of 2026-11-26: the dev issuer); STA-2795.
 */
import type { DevIssuerKey } from "@stackra/app";

/** A workspace's dev sign-in. */
export interface DevIssuerState {
  /** The dev issuer's key pair. */
  readonly key: DevIssuerKey;

  /** The seeded dev user. */
  readonly user: {
    /** Its `usr_` public id, made once per workspace. */
    readonly id: string;
    /** Its display name. */
    readonly name: string;
    /** Its email, under `example.test`, never a real mailbox. */
    readonly email: string;
  };
}
