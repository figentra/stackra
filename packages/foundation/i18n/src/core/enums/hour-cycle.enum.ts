/**
 * Stackra file contract:
 * Purpose: `HourCycle`, the clock a time is shown on: twelve hours with a day period, or twenty-four hours.
 * Boundary: an `Enum.of` value plus the type of the same name. `h12` and `h23` are the Unicode `hc` values Intl reads
 *           (a tool-owned spelling), so they apply as the `-u-hc-` extension of the locale tag. Which clock a Market or
 *           a user sees is the `Locale`'s default, overridden by `I18nConfig.formats` or the user's setting.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: Enum.of); ADR 0403 (seven languages: formats per locale).
 */
import { Enum } from "@stackra/contracts";

/** The clocks; `Enum.values(HourCycle)` lists them. */
export const HourCycle = Enum.of({
  /** 1 to 12 with AM and PM (or the language's day periods). */
  H12: "h12",
  /** 0 to 23. */
  H23: "h23",
});

/** One of the codes above. */
export type HourCycle = Enum.Value<typeof HourCycle>;
