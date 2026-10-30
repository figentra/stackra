/**
 * Stackra file contract:
 * Purpose: `PillarBandProps`, the props of `PillarBand` in `pillar-band.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); STA-1371 (doc pages wave, 2026-10-28).
 */
import type { ReactNode } from "react";

/** The three pillars, already translated. */
export interface PillarBandProps {
  /** What it is. */
  readonly what: ReactNode;
  /** When to use it. */
  readonly when: ReactNode;
  /** How it is built: accessibility, RTL and theming. */
  readonly how: ReactNode;
}
