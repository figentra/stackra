/**
 * Stackra file contract:
 * Purpose: `formatFileSize`, a byte count as the locale writes it in the largest fitting unit (`2.4 MB`, `٢٫٤ م.ب`),
 *          in powers of 1024 with at most one decimal.
 * Boundary: pure function over `Intl.NumberFormat`'s unit style; no React.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same output on web and native); ADR 0060 (Arabic digits);
 *          design-system gap inventory row 6.
 */

/** The units from smallest to largest, each 1024 times the one before. */
const UNITS = ["byte", "kilobyte", "megabyte", "gigabyte"] as const;

/** The size of `bytes` in `locale`, for example `formatFileSize(2_516_582, "en")` is `"2.4 MB"`. */
export function formatFileSize(bytes: number, locale: string): string {
  let value = Math.max(0, bytes);
  let index = 0;
  while (value >= 1024 && index < UNITS.length - 1) {
    value /= 1024;
    index += 1;
  }
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: UNITS[index],
    unitDisplay: "short",
    maximumFractionDigits: index === 0 ? 0 : 1,
  }).format(value);
}
