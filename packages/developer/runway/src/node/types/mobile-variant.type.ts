/**
 * Stackra file contract:
 * Purpose: `MobileVariant`, the per-scope data of a white-label build, as the OS event that starts it carries it: the
 *          scope it is for and the app identity that replaces the runway entry's (localised name, iOS bundle id,
 *          Android package, URL scheme, app-link hosts).
 * Boundary: type only; the OS builds it from the scope's brand and listing data (ADR 0439 decision 8), never from a
 *           repository. The icon and splash from the scope's theme are brand-kit's (stackra-13), not here.
 * Runtime: node
 * Governing contract: ADR 0439 (decision 8: built from data in the OS, started by an event); ADR 0323 and R-59 (scope).
 */

/** One white-label build's data. */
export type MobileVariant = {
  /** The scope id the build is for. */
  readonly scope: string;
  /** The identity that replaces the runway entry's, key by key. */
  readonly identity: {
    readonly name?: Readonly<Record<string, string>>;
    readonly ios?: { readonly bundleId: string };
    readonly android?: { readonly package: string };
    readonly scheme?: string;
    readonly links?: readonly string[];
  };
};
