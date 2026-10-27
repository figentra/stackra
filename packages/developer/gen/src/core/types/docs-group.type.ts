/**
 * Stackra file contract:
 * Purpose: `DocsGroup`, one navigation group of a docs site: its name, icon and pages. A page is its path under
 *          `src/docs` without the extension (`guides/structure`), a nested group, or `{ folder }`, every page directly
 *          in that folder (`index` first, then by path), so a long list such as the ADRs is never written by hand.
 * Boundary: a type only; `emitDocsSite` checks each page against `src/docs` and expands the folders.
 * Runtime: isomorphic
 * Governing contract: ADR 0002 (2026-10-27 amendment); STA-1316.
 */

/** One navigation group. */
export type DocsGroup = {
  /** The group's title. */
  readonly group: string;

  /** A Lucide icon name. */
  readonly icon?: string;

  /** Its pages, nested groups and folders, in order. */
  readonly pages: readonly (string | DocsGroup | { readonly folder: string })[];
};
