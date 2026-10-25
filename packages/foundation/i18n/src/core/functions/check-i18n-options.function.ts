/**
 * Stackra file contract:
 * Purpose: `checkI18nOptions(options, ctx)`, the cross-field rules of the i18n options: the default locale and every
 *          locale of the fallback table (a key or a chain entry) must be a shipped locale.
 * Boundary: pure; a zod `superRefine` callback that reports issues and never throws. Internal: `I18nConfig` registers
 *           `I18nConfig$.superRefine(checkI18nOptions)` for its schema, so `buildConfig` applies the rules to the class
 *           and to every member override, while the exported `I18nConfig$` stays extendable.
 * Runtime: isomorphic
 * Governing contract: ADR 0080, ADR 0146 as amended (validated configuration), ADR 0294 (decision 26).
 */
import type { z } from "zod";

import type { I18nConfig$ } from "#core/constants/i18n-config-schema.constant";

/**
 * Reports each locale the options name outside `locales`.
 *
 * @example
 * registerSchemas([[I18nOptions, I18nConfig$.superRefine(checkI18nOptions)]]);
 */
export function checkI18nOptions(
  options: z.output<typeof I18nConfig$>,
  ctx: z.core.$RefinementCtx,
): void {
  const shipped = new Set<string>(options.locales);
  if (!shipped.has(options.defaultLocale))
    ctx.addIssue({
      code: "custom",
      path: ["defaultLocale"],
      message: `The default locale ${options.defaultLocale} is not in locales`,
    });
  for (const [locale, chain] of Object.entries(options.fallbacks))
    for (const [index, fallback] of [locale, ...chain].entries())
      if (!shipped.has(fallback))
        ctx.addIssue({
          code: "custom",
          path: index === 0 ? ["fallbacks", locale] : ["fallbacks", locale, index - 1],
          message: `The fallback locale ${fallback} is not in locales`,
        });
}
