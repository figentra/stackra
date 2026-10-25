/**
 * Stackra file contract:
 * Purpose: the colours HeroUI v3 derives from the theme's roles with `color-mix(in oklab, …)` and paints (from
 *          `@heroui/styles` 3.2.6's theme blocks), per scheme: the hover of each solid role, the soft fill, soft hover
 *          and soft foreground of the accent and status colours, and the default, surface, field and background
 *          steps. A theme's own palette entry of the same name overrides one, as `web.css` does.
 * Boundary: data only; `paintedColour` evaluates it. Kept to what the components paint over text or marks; HeroUI's
 *          border and separator steps, which carry no text, are left out.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decision 4: check what is painted); ADR 0165 (HeroUI v3 on the web).
 */
import type { DerivedColour } from "#contracts/types/derived-colour.type";

/** `<from> <share>%` mixed with `<with>`, the rest of the hundred unless `withShare` says otherwise. */
const mix = (from: string, share: number, other: string, withShare?: number): DerivedColour =>
  withShare === undefined ? { from, share, with: other } : { from, share, with: other, withShare };

/** The same mix in both schemes. */
const both = (colour: DerivedColour) => ({ light: colour, dark: colour });

/** HeroUI's derived colours by painted name, light and dark. */
export const HEROUI_DERIVED_COLOURS: Readonly<
  Record<string, { readonly light: DerivedColour; readonly dark: DerivedColour }>
> = Object.freeze({
  "accent-hover": both(mix("accent", 90, "accent-foreground", 10)),
  "success-hover": both(mix("success", 90, "success-foreground", 10)),
  "warning-hover": both(mix("warning", 90, "warning-foreground", 10)),
  "danger-hover": both(mix("danger", 90, "danger-foreground", 10)),
  "default-hover": both(mix("default", 96, "default-foreground", 4)),
  "surface-hover": both(mix("surface", 92, "surface-foreground", 8)),
  "background-secondary": both(mix("background", 96, "foreground", 4)),
  "background-tertiary": both(mix("background", 92, "foreground", 8)),
  "field-hover": both(mix("field-background", 90, "field-foreground", 2)),
  "default-soft": both(mix("default", 50, "transparent")),
  "default-soft-foreground": both(mix("default-foreground", 100, "transparent")),
  "accent-soft": {
    light: mix("accent", 15, "transparent"),
    dark: mix("accent", 12, "transparent"),
  },
  "accent-soft-hover": {
    light: mix("accent", 20, "transparent"),
    dark: mix("accent", 16, "transparent"),
  },
  "accent-soft-foreground": {
    light: mix("accent", 70, "foreground", 30),
    dark: mix("accent", 80, "foreground", 30),
  },
  "danger-soft": both(mix("danger", 15, "transparent")),
  "danger-soft-hover": both(mix("danger", 20, "transparent")),
  "danger-soft-foreground": {
    light: mix("danger", 70, "foreground", 40),
    dark: mix("danger", 80, "foreground", 30),
  },
  "warning-soft": {
    light: mix("warning", 15, "transparent"),
    dark: mix("warning", 12, "transparent"),
  },
  "warning-soft-hover": {
    light: mix("warning", 20, "transparent"),
    dark: mix("warning", 16, "transparent"),
  },
  "warning-soft-foreground": {
    light: mix("warning", 80, "foreground", 70),
    dark: mix("warning", 80, "foreground", 30),
  },
  "success-soft": {
    light: mix("success", 15, "transparent"),
    dark: mix("success", 12, "transparent"),
  },
  "success-soft-hover": {
    light: mix("success", 20, "transparent"),
    dark: mix("success", 16, "transparent"),
  },
  "success-soft-foreground": {
    light: mix("success", 80, "foreground", 60),
    dark: mix("success", 80, "foreground", 30),
  },
});
