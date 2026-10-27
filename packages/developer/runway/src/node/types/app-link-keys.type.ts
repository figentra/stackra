/**
 * Stackra file contract:
 * Purpose: `AppLinkKeys`, the public identifiers the app-link files need that a root runway does not hold: Apple
 *          team ids by the team name `identity.ios.team` uses, and Android signing certificate SHA-256 fingerprints
 *          by app key.
 * Boundary: type only; `platformRows` takes it. Public values (they are published in the well-known files), never a
 *           key or password. A team named by its 10-character team id needs no entry.
 * Runtime: node
 * Governing contract: ADR 0439; app-shells 8.3 (Runway writes the app-link files to `wellknown:` keys).
 */

/** Identifiers for `apple-app-site-association` and `assetlinks.json`. */
export type AppLinkKeys = {
  /** Apple team id by team name (`figentra` → `ABCDE12345`). */
  readonly appleTeams?: Readonly<Record<string, string>>;
  /** Signing certificate SHA-256 fingerprints by mobile app key. */
  readonly androidCertificates?: Readonly<Record<string, readonly string[]>>;
};
