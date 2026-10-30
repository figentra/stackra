/**
 * Stackra file contract:
 * Purpose: `MEDIA_PLAYER_STEPS`, the MediaPlayer's fixed steps on web and native: the speeds offered by default, the
 *          seconds one seek moves and the volume one step moves.
 * Boundary: data only; the web and native players both read it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave D, owner approval 2026-10-30).
 */

/** The MediaPlayer's steps. */
export const MEDIA_PLAYER_STEPS = {
  /** The speeds the speed menu offers when the app names none. */
  rates: [0.5, 1, 1.25, 1.5, 2],
  /** The seconds a seek key or button moves. */
  seekSeconds: 5,
  /** The volume one step moves, of 1. */
  volumeStep: 0.1,
} as const;
