/**
 * Stackra file contract:
 * Purpose: the refused side of `resolveTheme`'s verdict: every finding, and for each colour the last layer changed that
 *          fails a contrast pair, the nearest colour that passes, for the form to offer (ADR 0340 decision 4). Nothing
 *          is corrected silently.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decisions 2 and 4).
 */
import type { ColorToken } from "#contracts/types/theme.type";
import type { ThemeFinding } from "#contracts/types/theme-finding.type";

/** The theme refused, with why and what would pass. */
export interface ThemeRefused {
  /** It was refused. */
  readonly accepted: false;
  /** Every finding, the refusing ones and the notices. */
  readonly findings: readonly ThemeFinding[];
  /** By theme path (`colors.accent`), the nearest colour that clears every contrast pair it takes part in. */
  readonly suggestions: Readonly<Record<string, ColorToken>>;
}
