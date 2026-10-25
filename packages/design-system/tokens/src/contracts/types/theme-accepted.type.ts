/**
 * Stackra file contract:
 * Purpose: the accepted side of `resolveTheme`'s verdict: the resolved theme and the notices it carries; a separation
 *          breach asks the interface to show every status with an icon and a label (ADR 0340 decision 5).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decisions 2 and 5).
 */
import type { Theme } from "#contracts/types/theme.type";
import type { ThemeFinding } from "#contracts/types/theme-finding.type";

/** The theme accepted, with the notices it carries. */
export interface ThemeAccepted {
  /** It was accepted. */
  readonly accepted: true;
  /** The resolved theme. */
  readonly theme: Theme;
  /** Findings that do not refuse: separation breaches. */
  readonly notices: readonly ThemeFinding[];
  /** True when a notice asks every status to be shown with an icon and a label, never by colour alone. */
  readonly requiresIconAndLabel: boolean;
}
