/**
 * Stackra file contract:
 * Purpose: `configuredDefault`, the default a member's override of a package config class gives one field
 *          (`I18nConfig.locales` from `src/config/i18n.config.ts`), so every emitter reads a host override the same way.
 * Boundary: pure. The override is the member's `config` shape whose base is the package class `base` from `from` or a
 *           subpath of it; undefined when the member has no override or the override does not set the field. The
 *           base default is the caller's: gen does not read a package's defaults yet.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 1: an override sets field defaults only); ADR 0294 (decision 26: defaults are
 *                     constants); STA-2065.
 */
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The host override's own default of `base.field`, or undefined when no override sets it.
 *
 * @param ir - the member read by discovery, with its `shapes`.
 * @param base - the package config class (`I18nConfig`).
 * @param from - the package that exports it (`@stackra/i18n`); a subpath export matches too.
 * @param field - the field (`locales`).
 * @example
 * configuredDefault(ir, "I18nConfig", "@stackra/i18n", "locales"); // ["en", "ar-SA"]
 */
export function configuredDefault(
  ir: MemberIR,
  base: string,
  from: string,
  field: string,
): unknown {
  return ir.shapes
    .find(
      (shape) =>
        shape.kind === "config" &&
        shape.base?.kind === "package" &&
        shape.base.name === base &&
        (shape.base.from === from || shape.base.from.startsWith(`${from}/`)),
    )
    ?.fields.find((candidate) => candidate.name === field)?.default?.value;
}
