/**
 * Stackra file contract:
 * Purpose: `normalizeSearchText`, text folded for matching: lower case, Latin accents and Arabic diacritics (tashkeel,
 *          tatweel) dropped, alef forms and taa marbuta unified, and anything but letters and digits removed.
 * Boundary: pure; for comparing only, never for display.
 * Runtime: isomorphic
 * Governing contract: ADR 0060 (Arabic); STA-1371.
 */

/** `text` folded for search: "Éclair" and "eclair" match, as do "إدارة" and "ادارة". */
export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replaceAll(/[̀-ًͯ-ٰٟـ]/g, "")
    .replaceAll(/[أإآ]/g, "ا")
    .replaceAll("ة", "ه")
    .replaceAll("ى", "ي")
    .toLowerCase()
    .replaceAll(/[^\p{L}\p{N}]+/gu, "");
}
