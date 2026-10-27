/**
 * Stackra file contract:
 * Purpose: `encodeEan13`, the bars of an EAN-13 (GTIN-13) barcode for shelf and food labels: 95 modules between an
 *          11-module and a 7-module quiet zone, and the 13 digits printed under them.
 * Boundary: encodes only; the number (a GTIN, or a price-embedded in-store code for weighed fresh goods) is the
 *           caller's. Twelve digits get their check digit; thirteen must carry the right one. Anything else answers
 *           `undefined`, so the caller can refuse with its own path. The code tables are ISO/IEC 15420's.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2).
 */

/** The L (odd parity) code of each digit; R is its complement and G is R reversed. */
const L_CODES = [
  "0001101",
  "0011001",
  "0010011",
  "0111101",
  "0100011",
  "0110001",
  "0101111",
  "0111011",
  "0110111",
  "0001011",
] as const;

/** The L/G parity of the six left digits, picked by the first digit. */
const PARITIES = [
  "LLLLLL",
  "LLGLGG",
  "LLGGLG",
  "LLGGGL",
  "LGLLGG",
  "LGGLLG",
  "LGGGLG",
  "LGLGLG",
  "LGLGGL",
  "LGGLGL",
] as const;

/** The light modules before and after the symbol. */
const QUIET_LEFT = 11;
const QUIET_RIGHT = 7;

/** The check digit of the first twelve digits. */
function checkDigitOf(digits: readonly number[]): number {
  const sum = digits.reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10;
}

/** `code` with every module flipped. */
function complement(code: string): string {
  return [...code].map((bit) => (bit === "1" ? "0" : "1")).join("");
}

/**
 * The modules (`true` dark) and digits of `value`, or `undefined` when it is not a valid EAN-13.
 *
 * @example
 * encodeEan13("400638133393")?.text; // "4006381333931"
 */
export function encodeEan13(
  value: string,
): { readonly modules: readonly boolean[]; readonly text: string } | undefined {
  if (!/^\d{12,13}$/u.test(value)) return undefined;
  const digits = [...value].map(Number);
  const check = checkDigitOf(digits.slice(0, 12));
  if (digits.length === 13 && digits[12] !== check) return undefined;
  const all = [...digits.slice(0, 12), check];
  const parity = PARITIES[all[0] ?? 0] ?? PARITIES[0];
  let bits = "0".repeat(QUIET_LEFT) + "101";
  all.slice(1, 7).forEach((digit, index) => {
    const left = L_CODES[digit] ?? "";
    bits +=
      parity[index] === "G"
        ? [...complement(left)].reduceRight((reversed, bit) => reversed + bit, "")
        : left;
  });
  bits += "01010";
  for (const digit of all.slice(7)) bits += complement(L_CODES[digit] ?? "");
  bits += "101" + "0".repeat(QUIET_RIGHT);
  return { modules: [...bits].map((bit) => bit === "1"), text: all.join("") };
}
