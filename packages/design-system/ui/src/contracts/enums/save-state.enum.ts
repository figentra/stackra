/**
 * Stackra file contract:
 * Purpose: the autosave states a SaveStatus shows: `idle` nothing, `saving` while a save runs, `saved` once it has
 *          landed and `failed` when it did not.
 * Boundary: the values only; each SaveStatus renders them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); design-system gap inventory row 8.
 */

/** The autosave states. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the states carry no labels.
export const SaveState = Object.freeze(["idle", "saving", "saved", "failed"] as const);

/** One autosave state. */
export type SaveState = (typeof SaveState)[number];
