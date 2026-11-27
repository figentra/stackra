/**
 * Stackra file contract:
 * Purpose: `StarterManifest`, the parsed `stackra.starter.yaml` at a starter's root: the ordered rename list and the
 *          profiles, each a path filter (`include` globs, less any `exclude` glob) with optional `overlay` files.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0515 (decisions 3 and 5); STA-1952 spec FR-006 and FR-007; STA-2859.
 */

/** A starter's manifest. */
export type StarterManifest = {
  /** The format version; 1. */
  readonly version: 1;

  /** Literal replacements applied in order to every text file; `to` may hold `{name}`, `{scope}` and `{key}`. */
  readonly rename: readonly { readonly from: string; readonly to: string }[];

  /** Profile name to its filter. */
  readonly profiles: Readonly<
    Record<
      string,
      {
        /** POSIX globs, relative to the root, of the files the profile writes. */
        readonly include: readonly string[];

        /**
         * POSIX globs, relative to the root, of files the profile leaves out although `include` matches them: the
         * starter repository's own tooling (its release or approval workflows) that an app must not inherit.
         */
        readonly exclude?: readonly string[];

        /** Target path to the starter file that replaces it in this profile. */
        readonly overlay?: Readonly<Record<string, string>>;
      }
    >
  >;
};
