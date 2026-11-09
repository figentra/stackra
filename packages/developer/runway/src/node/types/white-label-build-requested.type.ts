/**
 * Stackra file contract:
 * Purpose: `WhiteLabelBuildRequested`, the payload of the OS event `white_label.build.requested.v1` that starts a
 *          scope's white-label build: the build id, the scope, the app of the root runway `mobile`, the scope's app
 *          identity and the entitlement keys its plan grants.
 * Boundary: type only; `startWhiteLabelJob` takes it. A null or empty identity part means "keep the runway entry's".
 *           `entitlements` is every key the scope's plan grants, sorted, each `<module>.<name>`.
 * Runtime: node
 * Governing contract: ADR 0439 (decision 8: built from data in the OS, started by an event); STA-2074 (os#244).
 */

/** One `white_label.build.requested.v1` event. */
export type WhiteLabelBuildRequested = {
  /** The OS's id of this build request. */
  readonly buildId: string;
  /** The scope the build is for. */
  readonly scopeId: string;
  /** The app key under the root runway's `mobile`. */
  readonly app: string;
  /** The scope's app identity; a null or empty part keeps the runway entry's. */
  readonly identity: {
    /** The URL scheme, or null for the entry's. */
    readonly scheme: string | null;
    /** The app-link hosts; empty for the entry's. */
    readonly links: readonly string[];
    /** The app's name by locale; empty for the entry's. */
    readonly name: Readonly<Record<string, string>>;
    /** The iOS bundle id, or null for the entry's. */
    readonly ios: { readonly bundleId: string } | null;
    /** The Android package, or null for the entry's. */
    readonly android: { readonly package: string } | null;
  };
  /** Every entitlement key the scope's plan grants, sorted. */
  readonly entitlements: readonly string[];
};
