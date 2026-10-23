/**
 * Stackra file contract:
 * Purpose: what the shell's navigation and the index page need to link a playground page: its path and title. Every
 *          route class carries both as statics.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0294 (decision 14).
 */

/** A page the playground links to. */
export interface PageLink {
  /** The URL path, `/<route folder>`. */
  readonly path: string;
  /** The page title, which is also its h1. */
  readonly title: string;
  /** The navigation group the page sits under, such as `Pro`; a page without one is listed first. */
  readonly group?: string;
  /** Whether the page draws its own `main` landmark (the Pro AppLayout does); the shell then adds none, so a page has one. */
  readonly ownsMain?: boolean;
}
