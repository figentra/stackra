/**
 * Stackra file contract:
 * Purpose: `SiteThemeRevision`, one frozen revision of a theme: its number, the theme as it was, who made it and when, an
 *          optional note, and, for a rollback, the revision it restored.
 * Boundary: a type only. Revisions are never edited or removed: a rollback is a new revision with an old content.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 2: versions); ADR 0359 (decision 8: rollback re-applies a snapshot as new);
 *                     STA-1383 (renamed SiteTheme so Theme means design tokens).
 */
import type { SiteTheme } from "#core/types/site-theme.type";

/** One theme revision. */
export interface SiteThemeRevision {
  /** The revision number, from 1, one above the previous. */
  readonly number: number;

  /** The theme as of this revision. */
  readonly theme: SiteTheme;

  /** Who made it (a principal id). */
  readonly author: string;

  /** When, as an ISO 8601 instant. */
  readonly at: string;

  /** Why, in the author's words. */
  readonly note?: string;

  /** The revision a rollback restored. */
  readonly restores?: number;
}
