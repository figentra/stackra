/**
 * Stackra file contract:
 * Purpose: `DrawerPin`, the pin of the printer's drawer connector the cash drawer is wired to: 2 on most drawers, 5 on
 *          the rest.
 * Boundary: a type only; the two pins an ESC/POS drawer kick can pulse.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decision 4: the drawer kicks through the receipt printer).
 */

/** The drawer connector pin. */
export type DrawerPin = 2 | 5;
