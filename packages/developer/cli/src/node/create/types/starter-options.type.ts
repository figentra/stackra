/**
 * Stackra file contract:
 * Purpose: `StarterOptions`, what `starterFiles` turns a starter into an app with: the profile, the names and the
 *          `@stackra/*` version (and, for a pre-release check, the packed tarballs that override it).
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0515; STA-1952 spec FR-006 and FR-007.
 */

/** The answers a starter is written with. */
export type StarterOptions = {
  /** The profile of `stackra.starter.yaml` to write. */
  readonly profile: string;

  /** The app's package name, kebab-case. */
  readonly name: string;

  /** The npm scope, `@kebab`. */
  readonly scope: string;

  /** The exact `@stackra/*` version catalog `stackra` is pinned to: the running CLI's. */
  readonly stackraVersion: string;

  /** Package name to a `file:` tarball spec, written as pnpm overrides. */
  readonly tarballs?: Readonly<Record<string, string>>;
};
