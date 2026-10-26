/**
 * Stackra file contract:
 * Purpose: `WorkspaceMember`, one entry of `pnpm -r list --json --depth -1`: the package name and its directory.
 * Boundary: type only; `listMembers` reads it.
 * Runtime: node
 * Governing contract: the Workspace Layout rule; ADR 0010 (services are independent workspace members).
 */

/** One pnpm workspace member. */
export type WorkspaceMember = {
  /** The package name, or `undefined` when its manifest has none. */
  readonly name: string | undefined;

  /** The member directory relative to the root; "" for the root package. */
  readonly dir: string;

  /** The absolute member directory. */
  readonly path: string;
};
