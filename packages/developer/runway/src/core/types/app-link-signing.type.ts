/**
 * Stackra file contract:
 * Purpose: `AppLinkSigning`, what the app-link files need beyond the runway: the Apple team id of each store account
 *          key and the signing-certificate SHA-256 fingerprints of each Android package.
 * Boundary: type only. Both are public values the caller reads from the store accounts and the build credentials;
 *           neither is a secret, and Runway never reads a signing key.
 * Runtime: isomorphic
 * Governing contract: ADR 0439 (decision 2: Runway writes the app-link files to the edge), ADR 0437 (decision 6).
 */

/** Public signing facts for app links. */
export interface AppLinkSigning {
  /** Store account key (`identity.ios.team`) → Apple team id. */
  readonly appleTeamIds: Readonly<Record<string, string>>;

  /** Android package → its signing certificates' SHA-256 fingerprints. */
  readonly androidFingerprints: Readonly<Record<string, readonly string[]>>;
}
