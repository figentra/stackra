/**
 * Stackra file contract:
 * Purpose: `Locale`, the closed set of locales a member may ship: the seven base languages `ar`, `en`, `fr`, `de`,
 *          `es`, `it` and `nl` and the regional overlays `ar-SA`, `ar-AE`, `ar-EG`, `en-US` and `es-US`, each with its
 *          endonym (its name in its own language), its default first day of the week and its default clock as case
 *          data.
 * Boundary: an `Enum.of` value plus the type of the same name. Codes are BCP 47 tags in BCP 47 case (a tool-owned
 *           spelling, so not snake_case): they name the `assets/lang/<locale>/` folders and are the `lang` attribute;
 *           URL prefixes are their lowercase form (ADR 0297). Direction is not case data: the member's `I18nConfig.rtl`
 *           decides it. The week start and clock are CLDR defaults only: `I18nConfig.formats` overrides them, and
 *           which locales a Market offers is market-pack data. A new locale is a new case here.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (as amended by 0305 conventions 1), ADR 0192, ADR 0297 (decision 4), ADR 0231,
 *                     ADR 0403 (seven languages).
 */
import { Enum } from "@stackra/contracts";

import { HourCycle } from "#core/enums/hour-cycle.enum";

/**
 * The shipped locales; `Enum.meta(Locale, code)` gives its `endonym`, `weekStart` (ISO: 1 Monday, 6 Saturday,
 * 7 Sunday) and `hourCycle`.
 */
export const Locale = Enum.of({
  /** English, the default and the source of every catalogue. */
  En: ["en", { endonym: "English", weekStart: 1, hourCycle: HourCycle.H12 }],
  /** The American overlay of `en`: only the keys whose spelling or usage differs. */
  EnUs: ["en-US", { endonym: "English (United States)", weekStart: 7, hourCycle: HourCycle.H12 }],
  /** Arabic, reviewed by a native speaker before it ships (ADR 0192). */
  Ar: ["ar", { endonym: "العربية", weekStart: 6, hourCycle: HourCycle.H12 }],
  /** The Saudi overlay of `ar`. */
  ArSa: ["ar-SA", { endonym: "العربية (السعودية)", weekStart: 7, hourCycle: HourCycle.H12 }],
  /** The Emirati overlay of `ar`. */
  ArAe: ["ar-AE", { endonym: "العربية (الإمارات)", weekStart: 1, hourCycle: HourCycle.H12 }],
  /** The Egyptian overlay of `ar`. */
  ArEg: ["ar-EG", { endonym: "العربية (مصر)", weekStart: 6, hourCycle: HourCycle.H12 }],
  /** French. */
  Fr: ["fr", { endonym: "Français", weekStart: 1, hourCycle: HourCycle.H23 }],
  /** German. */
  De: ["de", { endonym: "Deutsch", weekStart: 1, hourCycle: HourCycle.H23 }],
  /** Spanish (Spain and the international base). */
  Es: ["es", { endonym: "Español", weekStart: 1, hourCycle: HourCycle.H23 }],
  /** The United States overlay of `es`. */
  EsUs: ["es-US", { endonym: "Español (Estados Unidos)", weekStart: 7, hourCycle: HourCycle.H12 }],
  /** Italian. */
  It: ["it", { endonym: "Italiano", weekStart: 1, hourCycle: HourCycle.H23 }],
  /** Dutch. */
  Nl: ["nl", { endonym: "Nederlands", weekStart: 1, hourCycle: HourCycle.H23 }],
});

/** One of the codes above. */
export type Locale = Enum.Value<typeof Locale>;
