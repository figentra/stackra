/**
 * Stackra file contract:
 * Purpose: `Locale`, the closed set of locales a member may ship: the base languages `en`, `ar`, `fr` and `de` and the
 *          regional overlays `en-US`, `ar-SA`, `ar-AE` and `ar-EG`, each with its endonym (its name in its own language) as case data.
 * Boundary: an `Enum.of` value plus the type of the same name. Codes are BCP 47 tags in BCP 47 case (a tool-owned
 *           spelling, so not snake_case): they name the `assets/lang/<locale>/` folders and are the `lang` attribute;
 *           URL prefixes are their lowercase form (ADR 0297). Direction is not case data: the member's `I18nConfig.rtl`
 *           decides it. A new locale is a new case here.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (as amended by 0305 conventions 1), ADR 0192, ADR 0297 (decision 4), ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** The shipped locales; `Enum.meta(Locale, code).endonym` names one in its own language. */
export const Locale = Enum.of({
  /** English, the default and the source of every catalogue. */
  En: ["en", { endonym: "English" }],
  /** The American overlay of `en`: only the keys whose spelling or usage differs. */
  EnUs: ["en-US", { endonym: "English (United States)" }],
  /** Arabic, reviewed by a native speaker before it ships (ADR 0192). */
  Ar: ["ar", { endonym: "العربية" }],
  /** The Saudi overlay of `ar`. */
  ArSa: ["ar-SA", { endonym: "العربية (السعودية)" }],
  /** The Emirati overlay of `ar`. */
  ArAe: ["ar-AE", { endonym: "العربية (الإمارات)" }],
  /** The Egyptian overlay of `ar`. */
  ArEg: ["ar-EG", { endonym: "العربية (مصر)" }],
  /** French. */
  Fr: ["fr", { endonym: "Français" }],
  /** German. */
  De: ["de", { endonym: "Deutsch" }],
});

/** One of the codes above. */
export type Locale = Enum.Value<typeof Locale>;
