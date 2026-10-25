/**
 * Stackra file contract:
 * Purpose: `spellArabic`, a count and its counted noun in Arabic words (tafqeet): "ألف ومائتان وخمسة وثلاثون ريالًا".
 * Boundary: internal to this package (`spellAmount` calls it); not exported from the entry. Grammar is code, nouns are
 *           data: the currency noun's forms and gender come from the market pack. Numbers agree with the noun's gender
 *           (reversed for 3 to 10), and the noun takes its dual, plural (3 to 10) or accusative (11 to 99) form from
 *           the last two digits. The nominative case throughout. Up to 999 trillion.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 3).
 */
import type { CurrencyWords } from "#core/types/currency-words.type";

/** The noun forms of one Arabic currency unit. */
type ArabicNoun = NonNullable<CurrencyWords["ar"]>["major"];

const ONES_MASCULINE = [
  "",
  "واحد",
  "اثنان",
  "ثلاثة",
  "أربعة",
  "خمسة",
  "ستة",
  "سبعة",
  "ثمانية",
  "تسعة",
  "عشرة",
];
const ONES_FEMININE = [
  "",
  "واحدة",
  "اثنتان",
  "ثلاث",
  "أربع",
  "خمس",
  "ست",
  "سبع",
  "ثماني",
  "تسع",
  "عشر",
];
const TENS = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const HUNDREDS = [
  "",
  "مائة",
  "مائتان",
  "ثلاثمائة",
  "أربعمائة",
  "خمسمائة",
  "ستمائة",
  "سبعمائة",
  "ثمانمائة",
  "تسعمائة",
];

/** Thousand, million, billion and trillion; all masculine. */
const SCALES = [
  { singular: "ألف", dual: "ألفان", plural: "آلاف", accusative: "ألفًا" },
  { singular: "مليون", dual: "مليونان", plural: "ملايين", accusative: "مليونًا" },
  { singular: "مليار", dual: "ملياران", plural: "مليارات", accusative: "مليارًا" },
  { singular: "تريليون", dual: "تريليونان", plural: "تريليونات", accusative: "تريليونًا" },
] as const;

/** 1 to 99, agreeing with a noun of the given gender. */
function belowHundred(count: number, feminine: boolean): string {
  const ones = feminine ? ONES_FEMININE : ONES_MASCULINE;
  if (count <= 10) return ones[count] ?? "";
  if (count === 11) return feminine ? "إحدى عشرة" : "أحد عشر";
  if (count === 12) return feminine ? "اثنتا عشرة" : "اثنا عشر";
  if (count < 20) return feminine ? `${ones[count - 10]} عشرة` : `${ones[count - 10]} عشر`;
  const unit = count % 10;
  const tens = TENS[Math.floor(count / 10)] ?? "";
  if (unit === 0) return tens;
  const unitWord = unit === 1 ? (feminine ? "إحدى" : "واحد") : ones[unit];
  return `${unitWord} و${tens}`;
}

/** 1 to 999. */
function belowThousand(count: number, feminine: boolean): string {
  const parts: string[] = [];
  const hundreds = Math.floor(count / 100);
  const rest = count % 100;
  if (hundreds > 0) parts.push(HUNDREDS[hundreds] ?? "");
  if (rest > 0) parts.push(belowHundred(rest, feminine));
  return parts.join(" و");
}

/** The noun form a count takes: dual is handled by the caller; 3 to 10 plural, 11 to 99 accusative, else singular. */
function formOf(
  count: bigint,
  noun: { singular: string; plural: string; accusative: string },
): string {
  const lastTwo = Number(count % 100n);
  if (lastTwo >= 3 && lastTwo <= 10) return noun.plural;
  if (lastTwo >= 11) return noun.accusative;
  return noun.singular;
}

/** A positive count in words, the units group agreeing with `feminine`. */
function numberWords(count: bigint, feminine: boolean): string {
  const groups: string[] = [];
  let rest = count;
  let scale = -1;
  while (rest > 0n) {
    const group = Number(rest % 1000n);
    rest /= 1000n;
    if (scale >= SCALES.length) throw new RangeError("spellArabic counts below 10^15 only");
    if (group > 0) {
      const name = SCALES[scale];
      if (name === undefined) groups.unshift(belowThousand(group, feminine));
      else if (group === 1) groups.unshift(name.singular);
      else if (group === 2) groups.unshift(name.dual);
      else groups.unshift(`${belowThousand(group, false)} ${formOf(BigInt(group), name)}`);
    }
    scale += 1;
  }
  return groups.join(" و");
}

/**
 * `count` of `noun` in Arabic words.
 *
 * @throws RangeError when `count` is negative or 10^15 or more.
 *
 * @example
 * spellArabic(1235n, riyal); // "ألف ومائتان وخمسة وثلاثون ريالًا"
 */
export function spellArabic(count: bigint, noun: ArabicNoun): string {
  if (count < 0n) throw new RangeError("spellArabic spells non-negative counts only");
  if (count === 0n) return `صفر ${noun.singular}`;
  if (count === 1n) return `${noun.singular} ${noun.feminine ? "واحدة" : "واحد"}`;
  if (count === 2n) return noun.dual;
  return `${numberWords(count, noun.feminine)} ${formOf(count, noun)}`;
}
