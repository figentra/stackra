/**
 * Stackra file contract:
 * Purpose: validates a theme before it is used or rendered: every colour role, font stack, shadow and radius is
 *          present and non-empty, hex values are hex, token names are kebab-case and no value can break out of a
 *          CSS declaration. A product's own theme goes through it, as the stackra theme does.
 * Boundary: checks and returns the theme unchanged; renders nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0232 (typed errors).
 */
import { ColorRole } from "#contracts/enums/color-role.enum";
import type { ColorToken, Theme } from "#contracts/types/theme.type";
import { InvalidThemeError } from "#core/errors/invalid-theme.error";

const TOKEN_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HEX = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i;
// A value is written into a CSS declaration as is; these characters would end it or open a block.
const UNSAFE = /[;{}\n\r]|\/\*/;
const FONT_FAMILIES = ["sans", "mono", "arabic"] as const;
const SHADOWS = ["surface", "overlay", "field"] as const;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/**
 * Returns `theme` when it is complete and safe to render, and throws `InvalidThemeError` listing every problem
 * otherwise. Use it to declare a theme: `export const ACME_THEME = defineTheme({ name: "acme", … })`.
 */
export function defineTheme(theme: Theme): Theme {
  const problems: string[] = [];
  const value = (path: string, candidate: unknown) => {
    if (typeof candidate !== "string" || candidate.trim() === "") problems.push(`${path} is empty`);
    else if (UNSAFE.test(candidate))
      problems.push(`${path} holds ";", "{", "}", "/*" or a line break`);
  };
  const color = (path: string, token: ColorToken | undefined) => {
    if (!isRecord(token)) return void problems.push(`${path} is missing`);
    value(`${path}.light`, token.light);
    value(`${path}.dark`, token.dark);
    for (const hex of ["hexLight", "hexDark"] as const)
      if (!HEX.test(String(token[hex])))
        problems.push(`${path}.${hex} is not #RRGGBB or #RRGGBBAA`);
  };
  const names = (path: string, record: unknown) => {
    if (!isRecord(record)) {
      problems.push(`${path} is missing`);
      return [];
    }
    const keys = Object.keys(record);
    for (const key of keys)
      if (!TOKEN_NAME.test(key)) problems.push(`${path}.${key} is not a kebab-case token name`);
    return keys;
  };

  if (typeof theme.name !== "string" || !TOKEN_NAME.test(theme.name))
    problems.push("name is not a kebab-case token name");

  for (const role of ColorRole) color(`colors.${role}`, theme.colors?.[role]);
  for (const key of names("palette", theme.palette)) {
    if ((ColorRole as readonly string[]).includes(key))
      problems.push(`palette.${key} repeats a colour role`);
    color(`palette.${key}`, theme.palette[key]);
  }

  for (const family of FONT_FAMILIES) value(`fontFamily.${family}`, theme.fontFamily?.[family]);

  for (const key of names("typography", theme.typography)) {
    const style = theme.typography[key];
    const path = `typography.${key}`;
    if (!isRecord(style)) {
      problems.push(`${path} is missing`);
      continue;
    }
    if (!Number.isInteger(style.weight) || style.weight < 100 || style.weight > 900)
      problems.push(`${path}.weight is not 100 to 900`);
    value(`${path}.size`, style.size);
    value(`${path}.lineHeight`, style.lineHeight);
    value(`${path}.letterSpacing`, style.letterSpacing);
    if (!(FONT_FAMILIES as readonly string[]).includes(style.family))
      problems.push(`${path}.family is not one of ${FONT_FAMILIES.join(", ")}`);
  }

  for (const key of names("spacing", theme.spacing)) value(`spacing.${key}`, theme.spacing[key]);

  value("radius.base", theme.radius?.base);
  value("radius.field", theme.radius?.field);
  for (const key of names("radius.steps", theme.radius?.steps))
    value(`radius.steps.${key}`, theme.radius.steps[key]);

  for (const shadow of SHADOWS) {
    value(`shadows.${shadow}.light`, theme.shadows?.[shadow]?.light);
    value(`shadows.${shadow}.dark`, theme.shadows?.[shadow]?.dark);
  }

  for (const key of names("motion", theme.motion)) {
    value(`motion.${key}.duration`, theme.motion[key]?.duration);
    value(`motion.${key}.easing`, theme.motion[key]?.easing);
  }

  if (problems.length > 0)
    throw new InvalidThemeError(typeof theme.name === "string" ? theme.name : "", problems);
  return theme;
}
