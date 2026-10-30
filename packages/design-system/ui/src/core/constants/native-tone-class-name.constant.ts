/**
 * Stackra file contract:
 * Purpose: the colour utility each text tone adds on native, on top of HeroUI Native's `color`: `TONE_CLASS_NAME`'s
 *          classes made important (`!`). HeroUI Native's component sheet sets `text__root--color-default` after the
 *          utilities, so a plain `text-success` lost and `tone="accent"` drew the default colour.
 * Boundary: data only. The class names are written out in full so Uniwind finds them when it scans this package
 *           (`@source`); never build them from a template.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decisions 2 and 3); ADR 0165 (UI contract).
 */
import type { TextTone } from "#contracts/enums/text-tone.enum";

/** The extra class each tone needs on native; an empty string when HeroUI's own `color` draws it. */
export const NATIVE_TONE_CLASS_NAME = Object.freeze({
  default: "",
  muted: "",
  accent: "!text-accent-soft-foreground",
  success: "!text-success",
  warning: "!text-warning",
  danger: "!text-danger",
} as const satisfies Record<TextTone, string>);
