/**
 * Stackra file contract:
 * Purpose: `VersionedCall`, what `serveVersioned` reads about one call: its container, the verified caller, the verified
 *          key's credential and the operation's output schema class.
 * Boundary: a type only. `credential` is structural (`versionPin` only), so this package names no `@stackra/actions`
 *           type.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (decisions 3 and 4); STA-2532.
 */
import type { AnyClass, Container } from "@stackra/container";
import type { Actor } from "@stackra/contracts";

/** What `serveVersioned` reads about the call. */
export interface VersionedCall {
  /** The call's container: `VersioningConfig`, and `VersionSupportSource` and `Clock` when bound. */
  readonly container: Pick<Container, "get" | "has">;

  /** The verified caller; an `api_client` is a key caller. */
  readonly actor: Actor;

  /** The verified API key's credential, when the call came with one; `versionPin` is its issue date. */
  readonly credential?: { readonly versionPin?: string | undefined } | undefined;

  /** The output schema class of the operation, whose registered dated changes shape the output; none leaves it as is. */
  readonly subject?: AnyClass | undefined;
}
