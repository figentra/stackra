/**
 * Stackra file contract:
 * Purpose: `CHORD_TIMEOUT`, how long, in milliseconds, the next step of a chord is awaited before the chord is dropped.
 * Boundary: data only; the keyboard bindings hand it to the driver.
 * Runtime: isomorphic
 * Governing contract: registry v3.1 final review H (chord sequences, 1.5 s timeout).
 */

/** 1.5 seconds between the steps of a chord. */
export const CHORD_TIMEOUT = 1500;
