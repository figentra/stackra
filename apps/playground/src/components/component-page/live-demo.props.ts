/**
 * Stackra file contract:
 * Purpose: `LiveDemoProps`, props of one live demo: which demo file to mount.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); showcase redesign spec (2026-10-27) section 4.
 */

/** Props of `LiveDemo`. */
export interface LiveDemoProps {
  /** The `DEMOS` key, from `demoPath`. */
  readonly path: string;
}
