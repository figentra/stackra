/**
 * Stackra file contract:
 * Purpose: the reasons an `EmptyState` is shown, which pick its default icon and are named on the element: `no-data`
 *          (nothing exists yet), `no-results` (a search or filter matched nothing) and `permission-denied` (there is
 *          something, but not for this user).
 * Boundary: the values only; the words are the caller's, because each reason needs its own copy and the design
 *           system carries none.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (decision 6).
 */

/** The empty-state reasons, `no-data` first. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the reasons carry no labels.
export const EmptyReason = Object.freeze(["no-data", "no-results", "permission-denied"] as const);

/** One reason an empty state is shown. */
export type EmptyReason = (typeof EmptyReason)[number];
