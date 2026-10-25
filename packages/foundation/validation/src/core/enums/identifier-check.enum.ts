/**
 * Stackra file contract:
 * Purpose: `IdentifierCheck`, the check-digit and structure algorithms an `IdentifierFormat` may name: Luhn (national
 *          ID numbers such as the Saudi ID, Iqama and Emirates ID), ISO 7064 mod 97-10 (IBAN), the GS1 mod 10 (GTIN,
 *          EAN, UPC) and a century-and-birth-date prefix (the Egyptian national ID).
 * Boundary: an `Enum.of` value plus the type of the same name. Algorithms only, named by what they compute, never by a
 *           country: which algorithm a Market's ID, tax number or bank account uses is market-pack data. A new
 *           algorithm is a new case and a branch in `checkIdentifier`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: Enum.of); ADR 0231 (snake_case codes); owner principle 2026-10-25
 *                     (configuration, not code).
 */
import { Enum } from "@stackra/contracts";

/**
 * The algorithms.
 *
 * @example
 * const nationalId: IdentifierFormat = { pattern: "^[12]\\d{9}$", check: IdentifierCheck.Luhn };
 */
export const IdentifierCheck = Enum.of({
  /** The Luhn mod 10 check digit (ISO/IEC 7812-1). */
  Luhn: "luhn",
  /** ISO 7064 mod 97-10 after moving the first four characters to the end (ISO 13616, IBAN). */
  Mod97: "mod97",
  /** The GS1 mod 10 check digit (GTIN-8, -12, -13 and -14). */
  Gs1: "gs1",
  /** A century digit (`2` for 1900s, `3` for 2000s) and a real `YYMMDD` birth date at the start. */
  CenturyBirthDate: "century_birth_date",
});

/** One of the codes above. */
export type IdentifierCheck = Enum.Value<typeof IdentifierCheck>;
