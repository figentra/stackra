/**
 * Stackra file contract:
 * Purpose: `RegionFormat`, how a native app formats dates, numbers, the clock and units: the phone's region (or the
 *          account's override for business documents) on top of the active locale's week start and clock, and the
 *          time zone dates are shown in.
 * Boundary: a type only; `regionFormat` builds it and `I18nProvider`'s `region` prop applies it.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (2026-10-29 note, STA-1534), ADR 0403 (formats per locale).
 */
import type { LocaleFormat } from "#core/types/locale-format.type";

/** The region formats of a native app. */
export interface RegionFormat extends LocaleFormat {
  /** The ISO 3166 region Intl formats with (`en` text in `DE` formats is `en-DE`); `null` keeps the locale's own. */
  readonly region: string | null;

  /** The units quantities are shown in: metric, US customary, or UK imperial. */
  readonly measurementSystem: "metric" | "us" | "uk";

  /** The IANA zone dates are shown in: the phone's, or the account's or business's where the app declares it; `null` is the runtime's. */
  readonly timeZone: string | null;
}
