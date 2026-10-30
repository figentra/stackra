/**
 * Stackra file contract:
 * Purpose: `ChartReadoutProps`, the props of the internal native `ChartReadout`.
 * Boundary: types only; not exported from the package.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; ADR 0060 (right-to-left); STA-1371 (chart style spec).
 */

/** The pressed row's title and its values, each with its resolved series colour. */
export interface ChartReadoutProps {
  readonly title: string;
  readonly items: readonly { readonly label: string; readonly value: string; readonly color: string }[];
  /** An 8px round dot (the default) or a 4×12 rounded bar, for line series. */
  readonly indicator?: "dot" | "line" | undefined;
}
