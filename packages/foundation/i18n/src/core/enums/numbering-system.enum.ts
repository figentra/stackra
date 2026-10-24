/**
 * Stackra file contract:
 * Purpose: `NumberingSystem`, the digits numbers, money and dates render with: Latin, Arabic-Indic, or the user's
 *          own (the locale's and device's default, never forced).
 * Boundary: an `Enum.of` value plus the type of the same name. `latn` and `arab` are the Unicode `nu` values Intl
 *           reads (a tool-owned spelling), so they apply as the `-u-nu-` extension of the locale tag; `user` adds no
 *           extension.
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (decision 2: Latin digits by default, Arabic-Indic optional), ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** The digit choices of `I18nConfig.numerals`. */
export const NumberingSystem = Enum.of({
  /** Latin digits (0 to 9) in every locale; the default (ADR 0192). */
  Latn: "latn",
  /** Arabic-Indic digits (٠ to ٩) in every locale. */
  Arab: "arab",
  /** The digits the locale and the user's device default to; the user's choice is never overridden. */
  User: "user",
});

/** One of the codes above. */
export type NumberingSystem = Enum.Value<typeof NumberingSystem>;
