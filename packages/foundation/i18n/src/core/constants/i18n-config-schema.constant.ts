/**
 * Stackra file contract:
 * Purpose: `I18nConfig$`, the zod schema of the i18n options: the package's shipped `X$`, which `buildConfig` validates
 *          `I18nConfig` (and a member's override) with, and which a member's generated schemas reuse through
 *          `I18nConfig$.extend(...)` instead of recompiling.
 * Boundary: mirrors `I18nOptions` field for field, with field rules only and no object-level refinement: gen's override
 *           schema is `I18nConfig$.extend({ locales: I18nConfig$.shape.locales.unwrap().default(...) })`, which zod
 *           refuses on a refined object. The cross-field rules (`checkI18nOptions`) join it where `I18nConfig`
 *           registers its schema. `rtl` may name locales a member does not ship (it is the script's direction).
 *           `zod` is imported here only because gen does not yet compile this package's schemas.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26), ADR 0095 as amended; registry v3.1 section 5 item 3 (a package's
 *                     shipped `X$`).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { HourCycle } from "#core/enums/hour-cycle.enum";
import { Locale } from "#core/enums/locale.enum";
import { LocaleUrlStrategy } from "#core/enums/locale-url-strategy.enum";
import { NumberingSystem } from "#core/enums/numbering-system.enum";

/** One locale code. */
const LOCALE = z.enum(Enum.values(Locale));

/** Whether no code appears twice. */
const distinct = (list: readonly string[]) => new Set(list).size === list.length;

// shortcut: authored until gen compiles this package's I18nOptions into #stackra/schemas; replace it with STA-339.
/** The schema of `I18nOptions`, with its defaults; extendable by a member's generated override schema. */
export const I18nConfig$ = z.object({
  locales: z
    .array(LOCALE)
    .min(1)
    .refine(distinct, { message: "Locales must be distinct" })
    .default(() => [Locale.En]),
  defaultLocale: LOCALE.default(Locale.En),
  rtl: z
    .array(LOCALE)
    .refine(distinct, { message: "Locales must be distinct" })
    .default(() => [Locale.Ar, Locale.ArSa, Locale.ArAe, Locale.ArEg]),
  fallbacks: z.record(z.string(), z.array(LOCALE)).default(() => ({})),
  numerals: z.enum(Enum.values(NumberingSystem)).default(NumberingSystem.Latn),
  formats: z
    .record(
      z.string(),
      z.object({
        weekStart: z.number().int().min(1).max(7).optional(),
        hourCycle: z.enum(Enum.values(HourCycle)).optional(),
      }),
    )
    .default(() => ({})),
  urlStrategy: z
    .enum(Enum.values(LocaleUrlStrategy))
    .default(LocaleUrlStrategy.PrefixExceptDefault),
  followDevice: z.boolean().default(false),
  tenantChoosesNumerals: z.boolean().default(false),
  failOnMissingLocale: z.boolean().default(false),
  cookieName: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/)
    .default("locale"),
});
