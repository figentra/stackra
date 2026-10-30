/**
 * Stackra file contract:
 * Purpose: `PillarBandProps`, the props of the native `PillarBand` in `pillar-band.tsx`.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (one declaration per file); STA-1371 (doc pages wave, 2026-10-28).
 */

/** The three pillars, already translated. */
export interface PillarBandProps {
  readonly what: string;
  readonly when: string;
  readonly how: string;
}
