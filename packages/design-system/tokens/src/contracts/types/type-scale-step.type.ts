/**
 * Stackra file contract:
 * Purpose: `TypeScaleStep`, one step of the utility type scale (see `ThemeTypeScale`).
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2).
 */
/** One step of the scale. */
export interface TypeScaleStep {
  /** The font size, `--text-<step>`. */
  readonly size: string;
  /** The line height, `--text-<step>--line-height`. */
  readonly lineHeight: string;
  /** `--text-<step>--font-weight`, when the step sets one. */
  readonly weight?: number | undefined;
  /** `--text-<step>--letter-spacing`, when the step sets one. */
  readonly tracking?: string | undefined;
  /** A fluid step: the size grows from `min` at the smallest breakpoint to `size` at the largest. */
  readonly fluidMin?: string | undefined;
}
