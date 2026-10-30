/**
 * Stackra file contract:
 * Purpose: how an `ExportDialog` hands the file over: a `download` in the browser, or an `email` the server sends
 *          when the file is built (for a large export).
 * Boundary: the values only; the app's `onExport` does the delivery.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); GAPS.md row 16 (owner decision 2026-10-28, P1 + P2 core).
 */

/** The deliveries, the immediate one first. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the deliveries carry no labels.
export const ExportDelivery = Object.freeze(["download", "email"] as const);

/** One way an export reaches the user. */
export type ExportDelivery = (typeof ExportDelivery)[number];
