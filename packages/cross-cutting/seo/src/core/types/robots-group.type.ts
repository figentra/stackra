/**
 * Stackra file contract:
 * Purpose: `RobotsGroup`, one group of `robots.txt`: the crawler it is for and that crawler's allowed and disallowed
 *          paths.
 * Boundary: a type only; `robotsTxt` writes one block per group, so a rule written for one crawler never applies to
 *           another.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 3); RFC 9309.
 */

/** One crawler's rules. */
export interface RobotsGroup {
  /** The crawler's product token, or `*` for every crawler. */
  readonly userAgent: string;
  /** Paths the crawler may fetch. */
  readonly allow: readonly string[];
  /** Paths the crawler must not fetch. */
  readonly disallow: readonly string[];
}
