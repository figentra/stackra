/**
 * Stackra file contract:
 * Purpose: `LineCheckout`, what a line checkout fetched: the line, the package and the exact version it resolved to,
 *          where it came from, the folder it is in, for a git checkout the commit, and every command it ran (or, in a
 *          dry run, planned).
 * Boundary: type only; `checkoutLine` returns it, `shellReleaseOf` and the mobile job read it. Plain data.
 * Runtime: node
 * Governing contract: ADR 0481.
 */

import type { DeployStep } from "#core/types/deploy-step.type";

/** One checked-out line release. */
export type LineCheckout = {
  /** The line, `os/mobile@3`. */
  readonly line: string;
  /** The line's major, `3`. */
  readonly major: string;
  /** The line's name, `mobile`: the surface of a web shell. */
  readonly name: string;
  /** The package, `@figentra/os-mobile`. */
  readonly package: string;
  /** The exact version, `3.0.2`. */
  readonly version: string;
  /** `registry` or `local`. */
  readonly from: "registry" | "local";
  /** The folder holding the release. */
  readonly dir: string;
  /** The commit of the folder, for a git checkout. */
  readonly sha?: string;
  /** The commands run, or planned in a dry run, in order. */
  readonly steps: readonly DeployStep[];
};
