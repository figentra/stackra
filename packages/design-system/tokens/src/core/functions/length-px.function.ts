/**
 * Stackra file contract:
 * Purpose: a theme length as React Native px: `px`, `rem` (16px), a unitless number, a multiple of the spacing unit
 *          (`calc(var(--spacing) * 9)`) and the radius variables a role names (`var(--radius)`, `var(--field-radius)`,
 *          `var(--radius-pill)`), so native reads the values the web stylesheet writes.
 * Boundary: pure. Anything else (`%`, `vw`, another `var()`) has no px form and gives `undefined`.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2: native keys).
 */
import type { Theme } from "#contracts/types/theme.type";

/** The px a root `rem` is on native, as on the web's default. */
const REM = 16;

/**
 * `length` in px.
 * @param theme - the theme the length belongs to, for the spacing unit and the radii it names
 * @param length - a CSS length from the theme
 * @returns the px, or `undefined` when the length has no px form
 */
export function lengthPx(theme: Theme, length: string): number | undefined {
  const text = length.trim();
  const plain = /^(-?(?:\d+(?:\.\d*)?|\.\d+))(px|rem)?$/.exec(text);
  if (plain) return Number(plain[1]) * (plain[2] === "rem" ? REM : 1);
  const multiple = /^calc\(var\(--spacing\)\s\*\s(-?(?:\d+(?:\.\d*)?|\.\d+))\)$/.exec(text);
  if (multiple) {
    const unit = lengthPx(theme, theme.layout.spacing);
    return unit === undefined ? undefined : unit * Number(multiple[1]);
  }
  if (text === "var(--radius)") return lengthPx(theme, theme.radius.base);
  if (text === "var(--field-radius)") return lengthPx(theme, theme.radius.field);
  if (text === "var(--radius-pill)") return 9999;
  return undefined;
}
