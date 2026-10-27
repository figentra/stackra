/**
 * Stackra file contract:
 * Purpose: the theme colour role of a StatusBadge's dot for each tone: the tone's own role, and `muted` for a neutral
 *          state so the dot stays visible on the chip's `default` background.
 * Boundary: data only; each runtime resolves the role (web: the CSS variable, native: `useThemeColor`). Internal:
 *          not in the `.` barrel, `react/` and `native/` import it by path.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0304 (decision 4); ADR 0165 (UI contract).
 */
import type { Tone } from "@stackra/contracts";

/** The theme role each tone's dot is drawn in; every value is a CSS variable of the theme and a HeroUI Native colour. */
export const STATUS_DOT_ROLE = Object.freeze({
  default: "muted",
  accent: "accent",
  success: "success",
  warning: "warning",
  danger: "danger",
} as const satisfies Record<Tone, string>);
