/**
 * Stackra file contract:
 * Purpose: the theme colour role each tone fills a native progress indicator in: the tone's own role, and the
 *          foreground-on-default role for `default`, which is what HeroUI's `progress-bar--default` uses on web.
 * Boundary: data only; native resolves the role with `useThemeColor`. Internal: not in the `.` barrel, `native/`
 *          imports it by path.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0165 (UI contract).
 */
import type { Tone } from "@stackra/contracts";

/** The theme role of each tone's fill; every value is a CSS variable of the theme and a HeroUI Native colour. */
export const PROGRESS_FILL_ROLE = Object.freeze({
  default: "default-foreground",
  accent: "accent",
  success: "success",
  warning: "warning",
  danger: "danger",
} as const satisfies Record<Tone, string>);
