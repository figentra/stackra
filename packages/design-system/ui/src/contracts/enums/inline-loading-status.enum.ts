/**
 * Stackra file contract:
 * Purpose: the inline loading states: `idle` draws nothing, `loading` a spinner, `success` a check and `error` an
 *          alert icon, each with its text, for a row-level save or a payment.
 * Boundary: the values only; each InlineLoading renders them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); design-system gap inventory row 28.
 */

/** The inline loading states. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the states carry no labels.
export const InlineLoadingStatus = Object.freeze(["idle", "loading", "success", "error"] as const);

/** One inline loading state. */
export type InlineLoadingStatus = (typeof InlineLoadingStatus)[number];
