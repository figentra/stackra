/**
 * Stackra file contract:
 * Purpose: `formatSequenceNumber`, a sequence number in its format pattern: `{n}` is the number, `{n:06}` the number
 *          zero-padded to six digits, `{year}` the period's year.
 * Boundary: pure. `Sequence` calls it at declaration to check a pattern, `SequenceService` to format every number it
 *           allocates or accepts. A number wider than its padding is written in full, never cut. Any other `{...}`
 *           token is refused, so a typo never reaches a legal document.
 * Runtime: node
 * Governing contract: ADR 0342 (decision 1: the format is a pattern).
 */

/** One `{...}` token. */
const TOKEN = /\{([^{}]*)\}/g;

/** The number token, with its optional zero padding (`n`, `n:06`). */
const NUMBER_TOKEN = /^n(?::0(\d{1,2}))?$/;

/**
 * Formats `number` with `format`.
 *
 * @param format - the pattern, such as `"INV-{year}-{n:06}"`.
 * @param number - the number, a whole number from 1.
 * @param year - the year `{year}` writes; needed only when the pattern has it.
 * @throws RangeError for a number that is not a whole number from 1.
 * @throws TypeError for an unknown token, or `{year}` without a year.
 * @example
 * formatSequenceNumber("INV-{year}-{n:06}", 42, 2026); // "INV-2026-000042"
 */
export function formatSequenceNumber(format: string, number: number, year?: number): string {
  if (!Number.isSafeInteger(number) || number < 1)
    throw new RangeError(`A sequence number is a whole number from 1, got ${number}`);
  return format.replace(TOKEN, (token: string, name: string) => {
    if (name === "year") {
      if (year === undefined || !Number.isInteger(year) || year < 1)
        throw new TypeError(`${token} needs the year of the number's period`);
      return String(year).padStart(4, "0");
    }
    const match = NUMBER_TOKEN.exec(name);
    if (match === null)
      throw new TypeError(`${token} is not a sequence format token: {n}, {n:06} or {year}`);
    return String(number).padStart(Number(match[1] ?? 0), "0");
  });
}
