/**
 * Stackra file contract:
 * Purpose: `spellEnglish`, a count and its counted noun in English words: "one thousand two hundred thirty-five
 *          riyals".
 * Boundary: internal to this package (`spellAmount` calls it); not exported from the entry. The noun's forms come from
 *           the market pack. No "and" inside a number; up to 999 trillion.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 3).
 */
import type { CurrencyWords } from "#core/types/currency-words.type";

/** The noun forms of one English currency unit. */
type EnglishNoun = NonNullable<CurrencyWords["en"]>["major"];

const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const SCALES = ["", "thousand", "million", "billion", "trillion"];

/** 1 to 999. */
function belowThousand(count: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(count / 100);
  const rest = count % 100;
  if (hundreds > 0) parts.push(`${ONES[hundreds]} hundred`);
  if (rest >= 20) {
    const unit = rest % 10;
    parts.push(`${TENS[Math.floor(rest / 10)]}${unit > 0 ? `-${ONES[unit]}` : ""}`);
  } else if (rest > 0) parts.push(ONES[rest] ?? "");
  return parts.join(" ");
}

/**
 * `count` of `noun` in English words.
 *
 * @throws RangeError when `count` is negative or 10^15 or more.
 *
 * @example
 * spellEnglish(21n, riyal); // "twenty-one riyals"
 */
export function spellEnglish(count: bigint, noun: EnglishNoun): string {
  if (count < 0n) throw new RangeError("spellEnglish spells non-negative counts only");
  const groups: string[] = [];
  let rest = count;
  let scale = 0;
  while (rest > 0n) {
    if (scale >= SCALES.length) throw new RangeError("spellEnglish counts below 10^15 only");
    const group = Number(rest % 1000n);
    rest /= 1000n;
    if (group > 0)
      groups.unshift(
        scale === 0 ? belowThousand(group) : `${belowThousand(group)} ${SCALES[scale]}`,
      );
    scale += 1;
  }
  const words = groups.length === 0 ? "zero" : groups.join(" ");
  return `${words} ${count === 1n ? noun.singular : noun.plural}`;
}
