/**
 * Stackra file contract:
 * Purpose: `ClockView`, which hand a TimeClock's face is setting: the hours or the minutes.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (wave D, owner approval 2026-10-30).
 */

/** The face a TimeClock shows. */
export type ClockView = "hours" | "minutes";
