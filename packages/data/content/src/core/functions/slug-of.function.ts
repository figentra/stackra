/**
 * Stackra file contract:
 * Purpose: `slugOf`, the URL slug of a title in any script: letters and digits of every script are kept (Arabic
 *          stays Arabic), case is folded, Arabic diacritics and tatweel are dropped, and every other run of
 *          characters becomes one hyphen.
 * Boundary: pure. Uniqueness per locale is the model's unique index, not this function; a title with no letter or
 *           digit has no slug and is refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0321 (decision 2: `Sluggable`, a unique slug per locale); ADR 0297 (URL paths).
 */

/** Arabic harakat, the superscript alef and tatweel: marks a slug never carries. */
const ARABIC_MARKS = /[ً-ٰٟـ]/g;

/** Every run of characters that is neither a letter nor a digit. */
const SEPARATORS = /[^\p{L}\p{N}]+/gu;

/** The longest slug kept. */
const MAX_LENGTH = 120;

/**
 * The slug of `title`.
 *
 * @throws RangeError when `title` has no letter or digit.
 * @example
 * slugOf("Summer Sale 2026"); // "summer-sale-2026"
 * slugOf("تخفيضات الصيف"); // "تخفيضات-الصيف"
 */
export function slugOf(title: string): string {
  const slug = title
    .normalize("NFKC")
    .replace(ARABIC_MARKS, "")
    .toLocaleLowerCase("en-US")
    .replace(SEPARATORS, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LENGTH)
    .replace(/-+$/, "");
  if (slug === "") throw new RangeError(`"${title}" has no letter or digit to make a slug of`);
  return slug;
}
