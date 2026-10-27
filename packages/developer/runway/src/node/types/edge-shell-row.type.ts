/**
 * Stackra file contract:
 * Purpose: `EdgeShellRow`, the value of a `shell:<surface>:<line>` row: the release every host serves and, while one
 *          runs, the canary release with its scopes.
 * Boundary: type only; `publishShell` and `promoteCanary` write it as JSON.
 * Runtime: node
 * Governing contract: app-shells 5.3 and 16 (point 3: the shells get their own canary).
 */
import type { EdgeCanary } from "#node/types/edge-canary.type";
import type { EdgeShellRelease } from "#node/types/edge-shell-release.type";

/** A shell line's row. */
export type EdgeShellRow = EdgeShellRelease & {
  /** The canary release, absent when none runs. */
  readonly canary?: EdgeCanary<EdgeShellRelease>;
};
