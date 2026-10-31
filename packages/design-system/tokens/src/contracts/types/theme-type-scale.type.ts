/**
 * Stackra file contract:
 * Purpose: `ThemeTypeScale`, part of the token schema of the Stackra Design System (see `Theme`): the utility type
 *          scale (Tailwind's `text-*`, `font-*`, `tracking-*` and `leading-*` theme variables), so the text sizes,
 *          weights, tracking and leading every component's utilities draw come from the theme, with the figures
 *          numbers take and the Arabic adjustment.
 * Boundary: a type only. The named text styles (`h1`, `body`, `metric`) are `Theme.typography`; these are the steps.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2); ADR 0302 (Stackra Design System); ADR 0231 (design tokens).
 */
import type { TypeScaleStep } from "#contracts/types/type-scale-step.type";

/** The utility type scale. */
export interface ThemeTypeScale {
  /** The steps, `--text-<step>` and their line height, weight and tracking. */
  readonly sizes: Readonly<Record<string, TypeScaleStep>>;
  /** Font weights, `--font-weight-<name>`, 100 to 900. */
  readonly weights: Readonly<Record<string, number>>;
  /** Letter spacing, `--tracking-<name>`. */
  readonly tracking: Readonly<Record<string, string>>;
  /** Line heights, `--leading-<name>`. */
  readonly leading: Readonly<Record<string, string>>;
  /** The figures numbers in data take, `--numeric-figures` (`tabular-nums`, `proportional-nums`). */
  readonly numeric: string;
  /**
   * The Arabic adjustment: under `:lang(ar)` every step's size is multiplied by `scale` and its line height raised by
   * `leading`, because Arabic letterforms read smaller and need more room above and below.
   */
  readonly arabic: { readonly scale: number; readonly leading: number };
}
