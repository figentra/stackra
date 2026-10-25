/**
 * Stackra file contract:
 * Purpose: the two display modes of a console: normal, which shows only the fields a product marks as essential, and
 *          developer, which shows every setting with its provenance and lock.
 * Boundary: the values only. A mode is display only: it never grants or denies an action, and hiding a field is not a
 *           security control. `ModeSwitch` sets it; the panel reads it to choose fields.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decisions 1 and 2); ADR 0302 (decision 3).
 */

/** The display modes, normal first (the default). */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of here (ADR 0128); the modes carry no labels.
export const DisplayMode = Object.freeze(["normal", "developer"] as const);

/** One display mode. */
export type DisplayMode = (typeof DisplayMode)[number];
