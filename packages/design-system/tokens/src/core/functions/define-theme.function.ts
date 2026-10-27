/**
 * Stackra file contract:
 * Purpose: validates a theme before it is used or rendered: every colour role, font stack, shadow and radius is
 *          present and non-empty, hex values are hex, token names are kebab-case, no two tokens render the same CSS
 *          custom property, and every value matches the grammar of its kind (colour, length, font stack, shadow,
 *          duration, easing), and the glass material's shares sit between 0 and 1 with px blurs. The grammars are allow-lists, so no value can escape its CSS declaration. A product's
 *          own theme goes through it, as the stackra theme does.
 * Boundary: checks and returns the theme unchanged; renders nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0232 (typed errors).
 */
import { ColorRole } from "#contracts/enums/color-role.enum";
import { MaterialLevel } from "#contracts/enums/material-level.enum";
import type { ColorToken } from "#contracts/types/color-token.type";
import type { Theme } from "#contracts/types/theme.type";
import { MATERIAL_PROPERTIES } from "#core/constants/material-properties.constant";
import { InvalidThemeError } from "#core/errors/invalid-theme.error";

const TOKEN_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HEX = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i;

// Values are written into CSS declarations as is, so each kind is an allow-list: no quote, backslash, angle bracket,
// semicolon, brace or comment can appear unless its grammar admits it, and parentheses only as whole functions.
// Every input must have one reading: two alternatives that match the same text (a digit run split two ways, `var()`
// as both a length and a colour, a space as part of an argument or of its separator) backtrack exponentially.
const NUMBER = String.raw`-?(\d+(\.\d*)?|\.\d+)`;
const VAR = String.raw`var\(--[a-z0-9-]+\)`;
const COLOR_LITERAL = String.raw`(#[0-9a-f]{3,8}|(oklch|oklab|rgb|hsl)\(\s*${NUMBER}%?(\s+${NUMBER}%?){2}(\s*\/\s*${NUMBER}%?)?\s*\)|transparent|currentcolor|white|black)`;
const LENGTH_LITERAL = String.raw`${NUMBER}(px|rem|em|%)?`;
const COLOR_SOURCE = String.raw`(${COLOR_LITERAL}|${VAR})`;
const LENGTH_SOURCE = String.raw`(${LENGTH_LITERAL}|${VAR})`;
const FAMILY = String.raw`("[\w .-]+"|'[\w .-]+'|[a-z][\w-]*( [a-z][\w-]*)*)`;
const SHADOW_PART = String.raw`(${LENGTH_LITERAL}|${COLOR_LITERAL}|${VAR}|inset)`;
const EASING_ARGUMENT = String.raw`[-\w.%]+(\s+[-\w.%]+)*`;
const SHADOW_LAYER = String.raw`${SHADOW_PART}(\s+${SHADOW_PART})*`;
const GRAMMAR = {
  color: new RegExp(`^${COLOR_SOURCE}$`, "i"),
  length: new RegExp(`^${LENGTH_SOURCE}$`, "i"),
  fontStack: new RegExp(String.raw`^${FAMILY}(\s*,\s*${FAMILY})*$`, "i"),
  shadow: new RegExp(String.raw`^(none|${SHADOW_LAYER}(\s*,\s*${SHADOW_LAYER})*)$`, "i"),
  duration: new RegExp(`^${NUMBER}(ms|s)$`),
  easing: new RegExp(
    String.raw`^(linear|ease|ease-in|ease-out|ease-in-out|step-start|step-end|(cubic-bezier|steps|linear)\(\s*${EASING_ARGUMENT}(\s*,\s*${EASING_ARGUMENT})*\s*\))$`,
  ),
} as const;
type Grammar = keyof typeof GRAMMAR;
// The forms of a type style the native renderer can turn into px: sizes in px, line heights unitless or px, letter
// spacing zero, em or px.
const PX = new RegExp(`^${NUMBER}px$`);
const UNITLESS_OR_PX = new RegExp(`^${NUMBER}(px)?$`);
const EM_OR_PX = new RegExp(`^${NUMBER}(px|em)?$`);
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
  const value = (path: string, candidate: unknown, grammar: Grammar) => {
    if (typeof candidate !== "string" || candidate.trim() === "") problems.push(`${path} is empty`);
    else if (!GRAMMAR[grammar].test(candidate.trim()))
      problems.push(`${path} is not a CSS ${grammar}`);
  };
  const color = (path: string, token: ColorToken | undefined) => {
    if (!isRecord(token)) return void problems.push(`${path} is missing`);
    value(`${path}.light`, token.light, "color");
    value(`${path}.dark`, token.dark, "color");
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
  const paletteKeys = names("palette", theme.palette);
  for (const key of paletteKeys) color(`palette.${key}`, theme.palette[key]);

  for (const family of FONT_FAMILIES)
    value(`fontFamily.${family}`, theme.fontFamily?.[family], "fontStack");

  const typographyKeys = names("typography", theme.typography);
  for (const key of typographyKeys) {
    const style = theme.typography[key];
    const path = `typography.${key}`;
    if (!isRecord(style)) {
      problems.push(`${path} is missing`);
      continue;
    }
    if (!Number.isInteger(style.weight) || style.weight < 100 || style.weight > 900)
      problems.push(`${path}.weight is not 100 to 900`);
    value(`${path}.size`, style.size, "length");
    value(`${path}.lineHeight`, style.lineHeight, "length");
    value(`${path}.letterSpacing`, style.letterSpacing, "length");
    // The native renderer computes absolute px (React Native takes no `em`, `rem` or unitless line height), so the
    // forms it can compute are the only ones a type style may use.
    for (const [field, form, said] of [
      ["size", PX, "a px length"],
      ["lineHeight", UNITLESS_OR_PX, "a unitless number or a px length"],
      ["letterSpacing", EM_OR_PX, "zero, an em or a px length"],
    ] as const) {
      const candidate = style[field];
      if (
        typeof candidate === "string" &&
        GRAMMAR.length.test(candidate.trim()) &&
        !form.test(candidate.trim())
      )
        problems.push(`${path}.${field} is not ${said}, which the native type scale needs`);
    }
    if (!(FONT_FAMILIES as readonly string[]).includes(style.family))
      problems.push(`${path}.family is not one of ${FONT_FAMILIES.join(", ")}`);
  }

  const spacingKeys = names("spacing", theme.spacing);
  for (const key of spacingKeys) value(`spacing.${key}`, theme.spacing[key], "length");

  value("radius.base", theme.radius?.base, "length");
  value("radius.field", theme.radius?.field, "length");
  const stepKeys = names("radius.steps", theme.radius?.steps);
  for (const key of stepKeys) value(`radius.steps.${key}`, theme.radius.steps[key], "length");

  for (const shadow of SHADOWS) {
    value(`shadows.${shadow}.light`, theme.shadows?.[shadow]?.light, "shadow");
    value(`shadows.${shadow}.dark`, theme.shadows?.[shadow]?.dark, "shadow");
  }

  const motionKeys = names("motion", theme.motion);
  for (const key of motionKeys) {
    value(`motion.${key}.duration`, theme.motion[key]?.duration, "duration");
    value(`motion.${key}.easing`, theme.motion[key]?.easing, "easing");
  }

  const share = (path: string, candidate: unknown) => {
    if (typeof candidate !== "number" || !(candidate >= 0 && candidate <= 1))
      problems.push(`${path} is not a share from 0 to 1`);
  };
  const shares = (path: string, token: unknown) => {
    if (!isRecord(token)) return void problems.push(`${path} is missing`);
    share(`${path}.light`, token.light);
    share(`${path}.dark`, token.dark);
  };
  if (isRecord(theme.materials)) {
    for (const level of MaterialLevel) {
      const path = `materials.levels.${level}`;
      const token: unknown = theme.materials.levels?.[level];
      if (!isRecord(token)) {
        problems.push(`${path} is missing`);
        continue;
      }
      shares(`${path}.fill`, token.fill);
      if (typeof token.blur !== "string" || !PX.test(token.blur.trim()))
        problems.push(`${path}.blur is not a px length`);
      if (typeof token.saturation !== "number" || !(token.saturation >= 0 && token.saturation <= 4))
        problems.push(`${path}.saturation is not a factor from 0 to 4`);
    }
    shares("materials.edge", theme.materials.edge);
    shares("materials.highlight", theme.materials.highlight);
  } else problems.push("materials is missing");

  // Every custom property the web renderer writes, as renderWebCss names them; two tokens must not write one.
  const rendered = [
    ...ColorRole,
    ...paletteKeys,
    ...SHADOWS.map((shadow) => `${shadow}-shadow`),
    ...FONT_FAMILIES.map((family) => `font-${family}`),
    ...typographyKeys.flatMap((key) => [key, `${key}-letter-spacing`]),
    ...spacingKeys.map((key) => `space-${key}`),
    "radius",
    "field-radius",
    ...stepKeys.map((key) => `radius-${key}`),
    ...motionKeys.flatMap((key) => [`duration-${key}`, `ease-${key}`]),
    ...MATERIAL_PROPERTIES,
  ];
  const seen = new Set<string>();
  for (const name of rendered)
    if (seen.has(name)) problems.push(`--${name} is written by two tokens`);
    else seen.add(name);

  if (problems.length > 0)
    throw InvalidThemeError.create({
      themeName: typeof theme.name === "string" ? theme.name : "",
      problems,
    });
  return theme;
}
