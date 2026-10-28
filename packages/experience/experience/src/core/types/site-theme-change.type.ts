/**
 * Stackra file contract:
 * Purpose: `SiteThemeChange`, who makes a theme revision, when, and why.
 * Boundary: a type only; the caller's audit context.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 2); STA-1383 (renamed SiteTheme so Theme means design tokens).
 */

/** The author's part of a revision. */
export interface SiteThemeChange {
  /** The principal id. */
  readonly author: string;

  /** The instant, ISO 8601. */
  readonly at: string;

  /** Why the author made the revision. */
  readonly note?: string;
}
