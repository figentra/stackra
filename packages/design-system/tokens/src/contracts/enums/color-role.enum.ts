/**
 * Stackra file contract:
 * Purpose: the semantic colour roles every theme defines, named exactly as the HeroUI v3 web and HeroUI Native theme
 *          variables (`--background`, `--accent-foreground`, …), so a role renders to its variable with no mapping.
 * Boundary: the role names only; values live in a Theme, rendering in core.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0165 (UI contract, HeroUI on web and native).
 */

/**
 * The colour roles, in the order HeroUI's theming docs list them. Verified against `@heroui/styles` 3.2.6
 * `themes/default/variables.css` and `heroui-native` 1.0.10 `src/styles/variables.css`.
 */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the roles carry no labels or tones.
export const ColorRole = Object.freeze([
  "background",
  "foreground",
  "surface",
  "surface-foreground",
  "surface-secondary",
  "surface-secondary-foreground",
  "surface-tertiary",
  "surface-tertiary-foreground",
  "overlay",
  "overlay-foreground",
  "muted",
  "default",
  "default-foreground",
  "accent",
  "accent-foreground",
  "success",
  "success-foreground",
  "warning",
  "warning-foreground",
  "danger",
  "danger-foreground",
  "field-background",
  "field-foreground",
  "field-placeholder",
  "field-border",
  "segment",
  "segment-foreground",
  "border",
  "separator",
  "focus",
  "link",
  "backdrop",
] as const);

/** One semantic colour role. */
export type ColorRole = (typeof ColorRole)[number];
