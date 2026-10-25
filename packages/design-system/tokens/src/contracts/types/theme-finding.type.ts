/**
 * Stackra file contract:
 * Purpose: one thing a theme check found: its code, the layer it came from, the theme path or painted name it is
 *          about, the scheme when it holds in one only, a sentence for people, and for a contrast finding the pair and
 *          the ratio measured, so a form can show the failure and the suggestion beside it.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decision 2).
 */
import type { ThemeFindingCode } from "#contracts/enums/theme-finding-code.enum";
import type { ContrastPair } from "#contracts/types/contrast-pair.type";

/** A finding of `resolveTheme`, `checkTheme` or `checkSeparation`. */
export interface ThemeFinding {
  /** What was found. */
  readonly code: ThemeFindingCode;
  /** The id of the layer it came from; the theme's name for a check of a whole theme. */
  readonly layer: string;
  /** The theme path (`colors.accent.light`) or painted name (`accent-soft`) it is about. */
  readonly path: string;
  /** The scheme it holds in, when it holds in one only. */
  readonly mode?: "light" | "dark";
  /** One sentence for people. */
  readonly detail: string;
  /** For `contrast_too_low`: the pair that failed. */
  readonly pair?: ContrastPair;
  /** For `contrast_too_low`: the ratio measured, to two decimals. */
  readonly ratio?: number;
}
