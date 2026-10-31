/**
 * Stackra file contract:
 * Purpose: validates a theme before it is used or rendered: every colour role, font stack, shadow and radius is
 *          present and non-empty, hex values are hex, token names are kebab-case, no two tokens render the same CSS
 *          custom property, and every value matches the grammar of its kind (colour, length, font stack, shadow,
 *          duration, easing; the optional display font stacks only when given; a length may also be
 *          `calc(var(--x) * n)`), and the glass material's shares sit between 0 and 1 with px blurs. The grammars are allow-lists, so no value can escape its CSS declaration. A product's
 *          own theme goes through it, as the stackra theme does.
 * Boundary: checks and returns the theme unchanged; renders nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0232 (typed errors).
 */
import { ColorRole } from "#contracts/enums/color-role.enum";
import { HapticPattern } from "#contracts/enums/haptic-pattern.enum";
import { MaterialFamily } from "#contracts/enums/material-family.enum";
import { MaterialLevel } from "#contracts/enums/material-level.enum";
import { MaterialMode } from "#contracts/enums/material-mode.enum";
import { MaterialRole } from "#contracts/enums/material-role.enum";
import type { ThemeMaterials } from "#contracts/types/theme-materials.type";
import type { ColorToken } from "#contracts/types/color-token.type";
import type { Theme } from "#contracts/types/theme.type";
import { FONT_FAMILY_VARIABLES } from "#core/constants/font-family-variables.constant";
import { MATERIAL_PROPERTIES } from "#core/constants/material-properties.constant";
import { materialLevelProblems } from "#core/functions/material-level-problems.function";
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
// A multiple of another length token, the one form of `calc()` a length may take (`calc(var(--spacing) * 9)`).
const MULTIPLE = String.raw`calc\(${VAR}\s\*\s${NUMBER}\)`;
const LENGTH_SOURCE = String.raw`(${LENGTH_LITERAL}|${VAR}|${MULTIPLE})`;
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
// A named easing is played by Motion and Reanimated too, so it must have a cubic-bezier form.
const PLAYABLE_EASING = new RegExp(
  String.raw`^(linear|ease|ease-in|ease-out|ease-in-out|cubic-bezier\(\s*${NUMBER}(\s*,\s*${NUMBER}){3}\s*\))$`,
);
const FONT_FAMILIES = ["sans", "mono", "arabic"] as const;
// The display stacks may be left out (they default to sans and arabic); when given they are checked like the rest.
const OPTIONAL_FONT_FAMILIES = ["display", "displayArabic"] as const;
const FAMILY_NAMES = Object.keys(FONT_FAMILY_VARIABLES);
const SHADOWS = ["surface", "overlay", "field", "raised", "pressed"] as const;
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
  for (const family of OPTIONAL_FONT_FAMILIES)
    if (theme.fontFamily?.[family] !== undefined)
      value(`fontFamily.${family}`, theme.fontFamily[family], "fontStack");

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
    if (!FAMILY_NAMES.includes(style.family))
      problems.push(`${path}.family is not one of ${FAMILY_NAMES.join(", ")}`);
  }

  const scale = theme.typeScale;
  const weight = (path: string, candidate: unknown) => {
    if (!Number.isInteger(candidate) || (candidate as number) < 100 || (candidate as number) > 900)
      problems.push(`${path} is not 100 to 900`);
  };
  const sizeKeys = names("typeScale.sizes", scale?.sizes);
  for (const key of sizeKeys) {
    const step = scale.sizes[key];
    const path = `typeScale.sizes.${key}`;
    value(`${path}.size`, step?.size, "length");
    value(`${path}.lineHeight`, step?.lineHeight, "length");
    if (step?.weight !== undefined) weight(`${path}.weight`, step.weight);
    if (step?.tracking !== undefined) value(`${path}.tracking`, step.tracking, "length");
    if (step?.fluidMin !== undefined) value(`${path}.fluidMin`, step.fluidMin, "length");
  }
  const weightKeys = names("typeScale.weights", scale?.weights);
  for (const key of weightKeys) weight(`typeScale.weights.${key}`, scale.weights[key]);
  const trackingKeys = names("typeScale.tracking", scale?.tracking);
  for (const key of trackingKeys) value(`typeScale.tracking.${key}`, scale.tracking[key], "length");
  const leadingKeys = names("typeScale.leading", scale?.leading);
  for (const key of leadingKeys) value(`typeScale.leading.${key}`, scale.leading[key], "length");
  if (!["tabular-nums", "proportional-nums", "normal"].includes(String(scale?.numeric)))
    problems.push("typeScale.numeric is not tabular-nums, proportional-nums or normal");
  const arabic = scale?.arabic;
  if (
    !isRecord(arabic) ||
    !(arabic.scale >= 0.5 && arabic.scale <= 2) ||
    !(arabic.leading >= 0 && arabic.leading <= 1)
  )
    problems.push("typeScale.arabic is not a scale from 0.5 to 2 and a leading from 0 to 1");

  const layout = theme.layout;
  const shareOf = (path: string, candidate: unknown) => {
    const number = Number(candidate);
    if (typeof candidate !== "string" || candidate.trim() === "" || !(number >= 0 && number <= 1))
      problems.push(`${path} is not a number from 0 to 1`);
  };
  const lengths = (path: string, record: unknown) => {
    const keys = names(path, record);
    for (const key of keys)
      value(`${path}.${key}`, (record as Record<string, unknown>)[key], "length");
    return keys;
  };
  for (const field of ["spacing", "touchTarget", "borderWidth", "fieldBorderWidth"] as const)
    value(`layout.${field}`, layout?.[field], "length");
  for (const field of ["padding", "gutter", "contentMaxWidth"] as const)
    value(`layout.page.${field}`, layout?.page?.[field], "length");
  value("layout.focusRing.width", layout?.focusRing?.width, "length");
  value("layout.focusRing.offset", layout?.focusRing?.offset, "length");
  if (!["solid", "dashed", "dotted", "double"].includes(String(layout?.focusRing?.style)))
    problems.push("layout.focusRing.style is not solid, dashed, dotted or double");
  if (layout?.cornerShape !== "round" && layout?.cornerShape !== "squircle")
    problems.push("layout.cornerShape is not round or squircle");
  for (const flag of ["vibrant", "animations"] as const)
    if (typeof layout?.[flag] !== "boolean") problems.push(`layout.${flag} is not a boolean`);
  if (layout?.cursor !== "pointer" && layout?.cursor !== "default")
    problems.push("layout.cursor is not pointer or default");
  if (!["shimmer", "pulse", "none"].includes(String(layout?.skeleton)))
    problems.push("layout.skeleton is not shimmer, pulse or none");
  const heightKeys = lengths("layout.controlHeight", layout?.controlHeight);
  const iconKeys = lengths("layout.iconSize", layout?.iconSize);
  const breakpointKeys = lengths("layout.breakpoints", layout?.breakpoints);
  const layoutSizeKeys = lengths("layout.sizes", layout?.sizes);
  const stateKeys = names("layout.state", layout?.state);
  for (const key of stateKeys) shareOf(`layout.state.${key}`, layout.state[key]);
  const opacityKeys = names("layout.opacity", layout?.opacity);
  for (const key of opacityKeys) shareOf(`layout.opacity.${key}`, layout.opacity[key]);
  const zKeys = names("layout.zIndex", layout?.zIndex);
  for (const key of zKeys)
    if (!/^-?\d+$/.test(String(layout.zIndex[key])))
      problems.push(`layout.zIndex.${key} is not an integer`);
  const regionKeys = names("layout.regions", layout?.regions);
  for (const key of regionKeys)
    if (!TOKEN_NAME.test(String(layout.regions[key])))
      problems.push(`layout.regions.${key} is not a kebab-case property name`);

  if (typeof theme.locale?.mirrorIcons !== "boolean")
    problems.push("locale.mirrorIcons is not a boolean");
  if (theme.locale?.digits !== "latn" && theme.locale?.digits !== "arab")
    problems.push("locale.digits is not latn or arab");

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

  const iconStrokeKeys = theme.iconStroke === undefined ? [] : Object.keys(theme.iconStroke);
  for (const key of iconStrokeKeys) {
    const width: unknown = theme.iconStroke?.[key];
    if (!/^[1-9]00$/.test(key) || typeof width !== "number" || !(width > 0 && width <= 4))
      problems.push(`iconStroke.${key} is not a weight (100 to 900) with a stroke from 0 to 4`);
  }
  if (theme.shadows?.floating !== undefined) {
    value("shadows.floating.light", theme.shadows.floating.light, "shadow");
    value("shadows.floating.dark", theme.shadows.floating.dark, "shadow");
  }
  // ADR 0501, the motion family: easings an animation library can play, springs with positive physics.
  const animation: Partial<Theme["animation"]> = isRecord(theme.animation) ? theme.animation : {};
  if (!isRecord(theme.animation)) problems.push("animation is missing");
  const easingKeys = names("animation.easings", animation.easings);
  for (const key of easingKeys) {
    const easing = animation.easings?.[key];
    if (typeof easing !== "string" || !PLAYABLE_EASING.test(easing.trim()))
      problems.push(`animation.easings.${key} is not a named easing or a cubic-bezier()`);
  }
  const springKeys = names("animation.springs", animation.springs);
  for (const key of springKeys)
    for (const field of ["stiffness", "damping", "mass"] as const) {
      const candidate: unknown = animation.springs?.[key]?.[field];
      if (typeof candidate !== "number" || !(candidate > 0 && candidate <= 10_000))
        problems.push(`animation.springs.${key}.${field} is not a number above 0`);
    }
  if (
    typeof animation.pressScale !== "number" ||
    !(animation.pressScale >= 0.8 && animation.pressScale <= 1)
  )
    problems.push("animation.pressScale is not a scale from 0.8 to 1");
  if (typeof animation.enterDistance !== "string" || !PX.test(animation.enterDistance.trim()))
    problems.push("animation.enterDistance is not a px length");
  const hapticKeys = names("haptics", theme.haptics);
  for (const key of hapticKeys)
    if (!HapticPattern.includes(theme.haptics[key] as HapticPattern))
      problems.push(`haptics.${key} is not one of ${HapticPattern.join(", ")}`);
  if (isRecord(theme.accessibility)) {
    const { contrast, textScales, chartSafe } = theme.accessibility;
    for (const role of Object.keys(isRecord(contrast) ? contrast : {}))
      if ((ColorRole as readonly string[]).includes(role))
        color(`accessibility.contrast.${role}`, contrast[role as ColorRole]);
      else problems.push(`accessibility.contrast.${role} is not a colour role`);
    for (const key of names("accessibility.textScales", textScales)) {
      const textScale: unknown = textScales[key];
      if (typeof textScale !== "number" || !(textScale >= 1 && textScale <= 3))
        problems.push(`accessibility.textScales.${key} is not a scale from 1 to 3`);
    }
    if (Array.isArray(chartSafe))
      chartSafe.forEach((token, index) => color(`accessibility.chartSafe.${index}`, token));
    else problems.push("accessibility.chartSafe is missing");
  } else problems.push("accessibility is missing");

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
      materialLevelProblems(path, token, problems);
    }
    shares("materials.edge", theme.materials.edge);
    shares("materials.highlight", theme.materials.highlight);
    const { family, defaultMode, roles } = theme.materials as Partial<ThemeMaterials>;
    if (family !== undefined && !MaterialFamily.includes(family))
      problems.push(`materials.family is not one of ${MaterialFamily.join(", ")}`);
    if (defaultMode !== undefined && !MaterialMode.includes(defaultMode))
      problems.push(`materials.defaultMode is not one of ${MaterialMode.join(", ")}`);
    if (roles !== undefined)
      for (const [owner, map] of Object.entries(roles as Record<string, unknown>)) {
        if (!MaterialFamily.includes(owner as MaterialFamily) || !isRecord(map)) {
          problems.push(`materials.roles.${owner} is not a family's role map`);
          continue;
        }
        for (const [role, level] of Object.entries(map))
          if (
            !MaterialRole.includes(role as MaterialRole) ||
            (level !== "solid" && !MaterialLevel.includes(level as MaterialLevel))
          )
            problems.push(
              `materials.roles.${owner}.${role} is not a role drawn at a level or solid`,
            );
      }
  } else problems.push("materials is missing");

  // Every custom property the web renderer writes, as renderWebCss names them; two tokens must not write one.
  const rendered = [
    ...ColorRole,
    ...paletteKeys,
    ...SHADOWS.map((shadow) => `${shadow}-shadow`),
    ...Object.values(FONT_FAMILY_VARIABLES),
    ...typographyKeys.flatMap((key) => [key, `${key}-letter-spacing`]),
    ...spacingKeys.map((key) => `space-${key}`),
    ...sizeKeys.flatMap((key) => [
      `text-${key}`,
      `text-${key}--line-height`,
      `text-${key}--font-weight`,
      `text-${key}--letter-spacing`,
    ]),
    ...weightKeys.map((key) => `font-weight-${key}`),
    ...trackingKeys.map((key) => `tracking-${key}`),
    ...leadingKeys.map((key) => `leading-${key}`),
    "numeric-figures",
    "spacing",
    "touch-target",
    "page-padding",
    "gutter",
    "content-max-width",
    "border-width",
    "field-border-width",
    "corner-shape",
    "cursor-interactive",
    "skeleton-animation",
    "focus-ring-width",
    "focus-ring-style",
    "ring-offset-width",
    "mirror",
    ...heightKeys.map((key) => `control-height-${key}`),
    ...iconKeys.map((key) => `icon-size-${key}`),
    ...breakpointKeys.map((key) => `breakpoint-${key}`),
    ...layoutSizeKeys.map((key) => `size-${key}`),
    ...stateKeys.map((key) => `state-${key}`),
    ...opacityKeys.map((key) => (key === "disabled" ? "disabled-opacity" : `opacity-${key}`)),
    ...zKeys.map((key) => `z-${key}`),
    ...regionKeys,
    "radius",
    "field-radius",
    ...stepKeys.map((key) => `radius-${key}`),
    ...motionKeys.flatMap((key) => [`duration-${key}`, `ease-${key}`]),
    ...iconStrokeKeys.map((key) => `icon-stroke-${key}`),
    ...easingKeys.map((key) => `ease-${key}`),
    ...springKeys.flatMap((key) => [`spring-${key}`, `spring-${key}-duration`]),
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
