/**
 * Stackra file contract:
 * Purpose: `bytesUnitOf(bytes, base)`, a byte count as a value in the largest `Intl` byte unit that keeps it at or above
 *          one: byte, kilobyte, megabyte, gigabyte, terabyte or petabyte.
 * Boundary: pure; `binary` divides by 1024 but keeps the same unit words, because `Intl` has no kibibyte.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (wave A).
 */

/** The units, smallest first. */
const UNITS = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte", "petabyte"] as const;

/** The value and unit to write `bytes` in. */
export function bytesUnitOf(
  bytes: number,
  base: "decimal" | "binary" = "decimal",
): { readonly value: number; readonly unit: (typeof UNITS)[number] } {
  const step = base === "binary" ? 1024 : 1000;
  let value = bytes;
  let index = 0;
  while (Math.abs(value) >= step && index < UNITS.length - 1) {
    value /= step;
    index += 1;
  }
  return { value, unit: UNITS[index] ?? "byte" };
}
