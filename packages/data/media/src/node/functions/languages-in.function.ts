/**
 * Stackra file contract:
 * Purpose: `languagesIn`, the language hints whose writing system appears in a text: what a text-layer extractor
 *          reports as the languages it found.
 * Boundary: pure. A hint's script is its likely script from CLDR (`Intl.Locale#maximize`), so `ar` is Arabic and `en`
 *           Latin; a hint is kept when one letter of that script is in the text. It tells scripts apart, not languages
 *           that share one (`en` and `fr` both stay when the text is Latin).
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (Arabic defaults); ADR 0222; STA-789.
 */

/** ISO 15924 codes CLDR gives that Unicode's `Script` property names differently. */
const UNICODE_SCRIPT: Readonly<Record<string, string>> = {
  Hans: "Hani",
  Hant: "Hani",
  Jpan: "Hira",
};

/** Whether `text` holds a letter of `language`'s likely script; true when the hint names no known script. */
function writes(text: string, language: string): boolean {
  try {
    const script = new Intl.Locale(language).maximize().script;
    if (script === undefined) return true;
    return new RegExp(`\\p{Script=${UNICODE_SCRIPT[script] ?? script}}`, "u").test(text);
  } catch {
    return true;
  }
}

/**
 * The hints, in their order, whose script appears in `text`.
 *
 * @example
 * languagesIn("العقد — The contract", ["ar", "en", "ru"]); // ["ar", "en"]
 */
export function languagesIn(text: string, languages: readonly string[]): string[] {
  return languages.filter((language) => writes(text, language));
}
