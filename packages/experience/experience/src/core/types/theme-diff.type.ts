/**
 * Stackra file contract:
 * Purpose: `ThemeDiff`, what `diffTheme` answers: the section keys and setting keys that were added, removed or changed.
 * Boundary: a type only; keys in code-unit order.
 * Runtime: isomorphic
 * Governing contract: ADR 0280 (decision 4: a reviewed diff); ADR 0270 (decision 2).
 */

/** The keys that differ between two themes. */
export interface ThemeDiff {
  /** Section keys added, removed or changed. */
  readonly sections: readonly string[];

  /** Setting keys added, removed or changed. */
  readonly settings: readonly string[];
}
