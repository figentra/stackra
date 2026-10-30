/**
 * Stackra file contract:
 * Purpose: the colour utility each text tone adds on top of HeroUI Typography's `color`: none for `default` and
 *          `muted` (HeroUI draws those), `text-<role>` for the status tones (the accent's text role, `accent-soft-foreground`, for `accent`), the route HeroUI Native's docs prescribe.
 *          The one tone-to-class map of the kit: Link reuses it (and writes its own `text-link` for `default`).
 * Boundary: data only. The class names are written out in full so Tailwind and Uniwind find them when they scan
 *          this package (`@source`); never build them from a template.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decisions 2 and 3); ADR 0165 (UI contract).
 */
import type { TextTone } from "#contracts/enums/text-tone.enum";

/** The extra class each tone needs; an empty string when HeroUI's own `color` draws it. */
export const TONE_CLASS_NAME = Object.freeze({
  default: "",
  muted: "",
  // The accent as text is its soft label: a light accent (amber) is under 2:1 on the page, its soft label 4.5:1 or more.
  accent: "text-accent-soft-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
} as const satisfies Record<TextTone, string>);
