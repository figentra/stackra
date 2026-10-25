/**
 * Stackra file contract:
 * Purpose: `spellAmount`, an amount in a currency's minor units written out in words in one language (tafqeet in
 *          Arabic): major and minor units, each with its noun.
 * Boundary: the currency's exponent and nouns are market-pack data (`CurrencyWords`); the grammar of each language is
 *           a speller in code. Spellers today: `ar` and `en`. Another language, a currency with no names in it, or a
 *           minor part with no minor noun throws `AmountWordsUnavailableError`. Wording around the amount ("only",
 *           "فقط … لا غير") is the template's `prefix` and `suffix`, not this function's.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 3); ADR 0363 (decision 3).
 */
import { AmountWordsUnavailableError } from "#core/errors/amount-words-unavailable.error";
import { spellArabic } from "#core/functions/spell-arabic.function";
import { spellEnglish } from "#core/functions/spell-english.function";
import type { CurrencyWords } from "#core/types/currency-words.type";

/** The two spelled parts, or `undefined` when the currency has no names in the language. */
function partsOf(
  major: bigint,
  minor: bigint,
  currency: CurrencyWords,
  language: string,
): { readonly major: string; readonly minor?: string; readonly and: string } | undefined {
  if (language === "ar" && currency.ar !== undefined) {
    const names = currency.ar;
    return {
      major: spellArabic(major, names.major),
      ...(minor > 0n && names.minor !== undefined
        ? { minor: spellArabic(minor, names.minor) }
        : {}),
      and: " و",
    };
  }
  if (language === "en" && currency.en !== undefined) {
    const names = currency.en;
    return {
      major: spellEnglish(major, names.major),
      ...(minor > 0n && names.minor !== undefined
        ? { minor: spellEnglish(minor, names.minor) }
        : {}),
      and: " and ",
    };
  }
  return undefined;
}

/**
 * `amount` minor units of `currency` in words in `language` (a BCP 47 language subtag).
 *
 * @throws AmountWordsUnavailableError when the language or the currency's names cannot spell it.
 * @throws RangeError when `amount` is negative.
 *
 * @example
 * spellAmount(123550n, pack.currency.words, "ar"); // "ألف ومائتان وخمسة وثلاثون ريالًا وخمسون هللة"
 */
export function spellAmount(amount: bigint, currency: CurrencyWords, language: string): string {
  if (amount < 0n) throw new RangeError("spellAmount spells non-negative amounts only");
  const unit = 10n ** BigInt(currency.exponent);
  const major = amount / unit;
  const minor = amount % unit;
  const parts = partsOf(major, minor, currency, language);
  if (parts === undefined || (minor > 0n && parts.minor === undefined))
    throw AmountWordsUnavailableError.create({ language });
  if (parts.minor === undefined) return parts.major;
  return major === 0n ? parts.minor : `${parts.major}${parts.and}${parts.minor}`;
}
