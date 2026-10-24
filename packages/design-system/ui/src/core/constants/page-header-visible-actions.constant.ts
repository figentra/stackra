/**
 * Stackra file contract:
 * Purpose: how many of a PageHeader's actions show as buttons before the rest go in the ActionMenu: three, the
 *          primary action and two beside it, so the bar stays one row on a tablet.
 * Boundary: data only; the web and native PageHeader and their tests share it.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 (decision 1, the page actions row).
 */

/** The most actions a PageHeader draws as buttons. */
export const PAGE_HEADER_VISIBLE_ACTIONS = 3;
