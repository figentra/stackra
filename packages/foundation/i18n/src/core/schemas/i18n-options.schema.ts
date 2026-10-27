/**
 * Stackra file contract:
 * Purpose: `I18nOptions`, the options shape of `I18nConfig`: the shipped locales and the default, the right-to-left
 *          set, each locale's fallback chain, the digits, each locale's week start and clock overrides, how a locale
 *          appears in a URL, and the flags gen and the runtime read (`followDevice`, `scopeChoosesNumerals`,
 *          `failOnMissingLocale`, `cookieName`).
 * Boundary: a shape class: fields, types, defaults and field rules only. The defaults are a launch member's (ADR 0080
 *           decision 2: English only, Latin digits); a member lists more locales in its `I18nConfig` override. The
 *           cross-field rules (the default and every fallback are shipped locales) live in `I18nConfig$`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 19), ADR 0080, ADR 0192, ADR 0297 (decision 4), ADR 0305 (conventions 1),
 *                     ADR 0403 (formats per locale).
 */
import { Enum } from "@stackra/contracts";
import { Field, List, Schema, Str } from "@stackra/validation";
import { z } from "zod";

import { HourCycle } from "#core/enums/hour-cycle.enum";
import { Locale } from "#core/enums/locale.enum";
import { LocaleUrlStrategy } from "#core/enums/locale-url-strategy.enum";
import { NumberingSystem } from "#core/enums/numbering-system.enum";
import type { LocaleFormat } from "#core/types/locale-format.type";

/** The options of `I18nConfig`. */
export class I18nOptions extends Schema {
  /** Every locale the member ships: base languages and regional overlays. */
  @List({
    min: 1,
    unique: true,
  })
  locales: Locale[] = [Locale.En];

  /** The right-to-left locales: `dir="rtl"`, the native layout flip and one RTL e2e project each. */
  @List({ unique: true })
  rtl: Locale[] = [Locale.Ar, Locale.ArSa, Locale.ArAe, Locale.ArEg];

  /** The cookie the browser writes to remember the visitor's choice; never read to redirect. */
  @Str({
    min: 1,
    max: 64,
    pattern: /^[A-Za-z0-9_-]+$/,
  })
  cookieName = "locale";

  /** Per locale, the week start and clock that replace the `Locale`'s defaults (`{ en: { hourCycle: "h23" } }`). */
  // reason: a record of partial interface values, which no typed decorator says; exact optionals match Partial<LocaleFormat>
  @Field(
    z.record(
      z.string(),
      z.object({
        weekStart: z.number().int().min(1).max(7).exactOptional(),
        hourCycle: z.enum(Enum.values(HourCycle)).exactOptional(),
      }),
    ),
  )
  formats: Record<string, Partial<LocaleFormat>> = {};

  /** The locale of a visitor nothing else decides for, and the unprefixed web locale. */
  defaultLocale: Locale = Locale.En;

  /** Per locale, the locales a missing key falls back to, nearest first (`ar-SA` → `ar` → `en`). */
  fallbacks: Record<string, Locale[]> = {};

  /** The digits of numbers, money and dates (ADR 0192: Latin by default). */
  numerals: NumberingSystem = NumberingSystem.Latn;

  /** How a web member's URLs carry the locale (ADR 0297 decision 4). */
  urlStrategy: LocaleUrlStrategy = LocaleUrlStrategy.PrefixExceptDefault;

  /** A native first launch takes the shipped locale closest to the device's. */
  followDevice = false;

  /** A scope setting may switch Arabic text to Arabic-Indic digits (ADR 0192). */
  scopeChoosesNumerals = false;

  /** Gen fails, instead of warning, on a base locale that misses a namespace. */
  failOnMissingLocale = false;
}
