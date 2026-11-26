/**
 * Stackra file contract:
 * Purpose: property tests of the identifier checks: `luhnValid`, `gtinCheckDigit`/`isGtin` and `mod97Valid` accept
 *          exactly one check value per body and catch every single-digit change; they, `constantTimeEqual` and the
 *          `e164()` and `publicId()` schemas answer any string without throwing; `normalizeIdentifier` and `e164()`
 *          are fixed points of their own output; `constantTimeEqual` agrees with `===`.
 * Boundary: test only; fast-check generates the bodies and strings.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (unit tier, the 90% validation floor); ADR 0022; ADR 0269; ISO/IEC 7812 (Luhn), GS1
 *                     (GTIN), ISO 7064 (MOD 97-10), ITU-T E.164; STA-2887.
 */
import { mintPublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import * as fc from "fast-check";

import { constantTimeEqual } from "#core/functions/constant-time-equal.function";
import { e164 } from "#core/functions/e164.function";
import { gtinCheckDigit } from "#core/functions/gtin-check-digit.function";
import { isGtin } from "#core/functions/is-gtin.function";
import { luhnValid } from "#core/functions/luhn-valid.function";
import { mod97Valid } from "#core/functions/mod97-valid.function";
import { normalizeIdentifier } from "#core/functions/normalize-identifier.function";
import { publicId } from "#core/functions/public-id.function";

/** A string of `min` to `max` decimal digits. */
const digits = (min: number, max: number) => fc.stringMatching(new RegExp(`^\\d{${min},${max}}$`));

/** Any string: printable, and any UTF-16 code units. */
const anyString = fc.oneof(
  fc.string(),
  fc.string({ unit: "binary" }),
  fc.string({ unit: "grapheme" }),
);

/** `text` with the digit at `index` replaced by another digit. */
function withDigitChanged(text: string, index: number, step: number): string {
  const at = index % text.length;
  const digit = (Number(text.charAt(at)) + 1 + (step % 9)) % 10;
  return `${text.slice(0, at)}${digit}${text.slice(at + 1)}`;
}

/** `text` with every ASCII digit written as an Arabic-Indic digit (٠ to ٩). */
function arabicIndic(text: string): string {
  return text.replaceAll(/\d/g, (digit) => String.fromCodePoint(0x06_60 + Number(digit)));
}

/** The MOD 97-10 check digits of `country` and `bban` (ISO 7064), as `mod97Valid` expects them. */
function ibanOf(country: string, bban: string): string {
  let remainder = 0n;
  for (const char of `${bban}${country}00`)
    remainder =
      (remainder * (char >= "A" ? 100n : 10n) +
        BigInt(char >= "A" ? (char.codePointAt(0) ?? 0) - 55 : Number(char))) %
      97n;
  return `${country}${String(98n - remainder).padStart(2, "0")}${bban}`;
}

describe("Luhn (properties)", () => {
  it("accepts exactly one check digit per body and catches every single-digit change", () => {
    fc.assert(
      fc.property(digits(1, 30), fc.nat(), fc.nat(), (body, index, step) => {
        const valid = [..."0123456789"].filter((check) => luhnValid(`${body}${check}`));
        expect(valid).toHaveLength(1);
        const number = `${body}${valid[0]}`;
        expect(luhnValid(withDigitChanged(number, index, step))).toBe(false);
      }),
    );
  });
});

describe("GTIN (properties)", () => {
  it("accepts a body with its check digit, and no other last digit", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(7, 11, 12, 13).chain((length) => digits(length, length)),
        fc.nat({ max: 9 }),
        (body, other) => {
          const check = gtinCheckDigit(body);
          expect(isGtin(`${body}${check}`)).toBe(true);
          if (other !== check) expect(isGtin(`${body}${other}`)).toBe(false);
        },
      ),
    );
  });

  it("catches every single-digit change of a valid GTIN", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(7, 11, 12, 13).chain((length) => digits(length, length)),
        fc.nat(),
        fc.nat(),
        (body, index, step) => {
          expect(isGtin(withDigitChanged(`${body}${gtinCheckDigit(body)}`, index, step))).toBe(
            false,
          );
        },
      ),
    );
  });
});

describe("MOD 97-10 (properties)", () => {
  it("accepts the check digits ISO 7064 gives and catches every single-digit change of the account", () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Z]{2}$/),
        digits(10, 30),
        fc.nat(),
        fc.nat(),
        (country, bban, index, step) => {
          expect(mod97Valid(ibanOf(country, bban))).toBe(true);
          expect(
            mod97Valid(ibanOf(country, bban).slice(0, 4) + withDigitChanged(bban, index, step)),
          ).toBe(false);
        },
      ),
    );
  });

  it("accepts letters in the account as ISO 7064 expands them", () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Z]{2}$/),
        fc.stringMatching(/^[0-9A-Z]{4,30}$/),
        (country, bban) => {
          expect(mod97Valid(ibanOf(country, bban))).toBe(true);
        },
      ),
    );
  });
});

describe("identifier checks on any input (properties)", () => {
  it("answers any string with a boolean or a parse result, never an exception", () => {
    const schemas = [e164(), publicId("usr")];
    fc.assert(
      fc.property(anyString, (text) => {
        expect(typeof luhnValid(text)).toBe("boolean");
        expect(typeof isGtin(text)).toBe("boolean");
        expect(typeof mod97Valid(text)).toBe("boolean");
        for (const schema of schemas) expect(typeof schema.safeParse(text).success).toBe("boolean");
      }),
    );
  });

  it("compares in constant time exactly as === does", () => {
    fc.assert(
      fc.property(anyString, anyString, fc.boolean(), (left, right, same) => {
        const other = same ? left : right;
        expect(constantTimeEqual(left, other)).toBe(left === other);
      }),
    );
  });

  it("normalises an identifier to a fixed point", () => {
    fc.assert(
      fc.property(anyString, (text) => {
        const once = normalizeIdentifier(text);
        expect(normalizeIdentifier(once)).toBe(once);
      }),
    );
  });
});

describe("e164() and publicId() (properties)", () => {
  /** A phone number in E.164: a plus, a non-zero digit, 7 to 14 more digits. */
  const number = fc.stringMatching(/^\+[1-9]\d{7,14}$/);

  it("reads any typed form of a number as the number, and its output as itself", () => {
    const schema = e164();
    fc.assert(
      fc.property(
        number,
        fc.constantFrom(" ", "-", ".", ""),
        fc.boolean(),
        fc.boolean(),
        (value, separator, zeros, arabic) => {
          const grouped = value.slice(1).replaceAll(/(\d{3})(?=\d)/g, `$1${separator}`);
          const typed = `${zeros ? "00" : "+"}${arabic ? arabicIndic(grouped) : grouped}`;
          expect(schema.parse(typed)).toBe(value);
          expect(schema.parse(value)).toBe(value);
        },
      ),
    );
  });

  it("accepts every id mintPublicId writes for its prefix, and refuses it under another", () => {
    const users = publicId("usr");
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 48 - 1 }), (time) => {
        expect(users.safeParse(mintPublicId("usr", time)).success).toBe(true);
        expect(users.safeParse(mintPublicId("ord", time)).success).toBe(false);
      }),
    );
  });
});
