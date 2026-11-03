/**
 * Stackra file contract:
 * Purpose: `configuredDefault`, the default a member's override of a package config class gives one field
 *          (`I18nConfig.locales` from `src/config/i18n.config.ts`), or the field's base default from
 *          `CONFIG_DEFAULTS`, so every emitter reads a host override the same way.
 * Boundary: pure. The override is the member's `config` shape whose base is the package class `base` from `from` or a
 *           subpath of it. The base default is taken when the member has no override, the override does not set the
 *           field, or sets it to a value of another type than the base default (an array, a string); undefined when
 *           neither the override nor `CONFIG_DEFAULTS` gives one.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 1: an override sets field defaults only); ADR 0294 (decision 26: defaults are
 *                     constants); STA-2065.
 */
import { CONFIG_DEFAULTS } from "#core/constants/config-defaults.constant";
import type { MemberIR } from "#core/types/member-ir.type";

/** `"array"` for an array, else the value's `typeof`. */
const kindOf = (value: unknown): string => (Array.isArray(value) ? "array" : typeof value);

/**
 * The host override's own default of `base.field`, or its base default when no override sets one of the base's type.
 *
 * @param ir - the member read by discovery, with its `shapes`.
 * @param base - the package config class (`I18nConfig`).
 * @param from - the package that exports it (`@stackra/i18n`); a subpath export matches too.
 * @param field - the field (`locales`).
 * @example
 * configuredDefault(ir, "I18nConfig", "@stackra/i18n", "locales"); // ["en", "ar-SA"], or ["en"] with no override
 */
export function configuredDefault(
  ir: MemberIR,
  base: string,
  from: string,
  field: string,
): unknown {
  const own = ir.shapes
    .find(
      (shape) =>
        shape.kind === "config" &&
        shape.base?.kind === "package" &&
        shape.base.name === base &&
        (shape.base.from === from || shape.base.from.startsWith(`${from}/`)),
    )
    ?.fields.find((candidate) => candidate.name === field)?.default?.value;
  const fallback = CONFIG_DEFAULTS[`${base}.${field}`];
  return own !== undefined && (fallback === undefined || kindOf(own) === kindOf(fallback))
    ? own
    : fallback;
}
