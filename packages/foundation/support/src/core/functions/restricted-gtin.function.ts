/**
 * Stackra file contract:
 * Purpose: `restrictedGtin(prefix, serial)`, a GS1 restricted-circulation GTIN-13 for a tenant with no GS1 company
 *          prefix: the restricted prefix the tenant's settings name, the serial its counter allocated, zero-padded,
 *          and the GS1 mod-10 check digit.
 * Boundary: pure mechanism. The prefix and the next serial are the caller's (`settings:tenant:barcode-source` and the
 *           tenant's counter, MUS-34); the function only refuses a prefix outside GS1's restricted ranges (02, 04,
 *           20 to 29) and a serial that does not fit. The check digit is computed here, not imported, because this
 *           package has no dependency; `@stackra/validation` owns GTIN validation (conflict #1).
 * Runtime: isomorphic
 * Governing contract: GS1 General Specifications (restricted circulation numbers); ADR 0305; MUS-34; COM-78.
 */

/** GS1's restricted-circulation GTIN-13 prefixes: 02, 04 and 20 to 29. */
const RESTRICTED = /^(?:0[24]|2\d)\d*$/;

/**
 * The GTIN-13 of `serial` under `prefix`.
 *
 * @param prefix - a restricted prefix of 2 to 11 digits (`"20"`, `"0412"`).
 * @param serial - the tenant's next number, from 0.
 * @throws RangeError when the prefix is not restricted or the serial does not fit in the digits left.
 * @example
 * restrictedGtin("20", 1); // "2000000000015"
 */
export function restrictedGtin(prefix: string, serial: number | bigint): string {
  if (!/^\d{2,11}$/.test(prefix) || !RESTRICTED.test(prefix))
    throw new RangeError(`restrictedGtin: "${prefix}" is not a GS1 restricted-circulation prefix`);
  const value = BigInt(serial);
  const width = 12 - prefix.length;
  if (value < 0n || value >= 10n ** BigInt(width))
    throw new RangeError(`restrictedGtin: serial ${value} does not fit in ${width} digits`);
  const body = `${prefix}${value.toString().padStart(width, "0")}`;
  let sum = 0;
  for (const [index, digit] of [...body].reverse().entries())
    sum += Number(digit) * (index % 2 === 0 ? 3 : 1);
  return `${body}${(10 - (sum % 10)) % 10}`;
}
