/**
 * Stackra file contract:
 * Purpose: `tokenCssVar`, the theme CSS variable a registry token name reads on web ("color.accent" -> "--accent"),
 *          for the doc page's token table; undefined when the token has no single variable (spacing.page).
 * Boundary: a pure function over the names `@stackra/tokens` writes into `themes/<brand>/web.css`.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (doc pages wave, 2026-10-28); ADR 0060 (tokens).
 */

/** The names that do not follow `<group>.<name>` -> `--<name>`. */
const NAMED: Readonly<Record<string, string>> = {
  "color.field": "--field-background",
  "radius.base": "--radius",
  "radius.field": "--field-radius",
  "radius.lg": "--radius-lg",
  "radius.full": "--radius-full",
  "shadow.overlay": "--overlay-shadow",
  "motion.duration": "--duration-base",
  "motion.base": "--duration-base",
  "motion.press": "--duration-fast",
  "motion.fast": "--duration-fast",
  "motion.reveal": "--duration-reveal",
};

/** The CSS variable of `token`, or undefined. */
export function tokenCssVar(token: string): string | undefined {
  if (token in NAMED) return NAMED[token];
  const [group, name] = token.split(".");
  return group === "color" && name ? `--${name}` : undefined;
}
