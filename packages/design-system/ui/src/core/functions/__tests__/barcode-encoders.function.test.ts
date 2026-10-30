/**
 * Stackra file contract:
 * Purpose: proves the barcode encoders against reference data: the Code 128 table (107 distinct symbols, 11 modules
 *          each, the stop 13), the subset B and C choice and the mod-103 check (the "PJJ123C" example), the EAN-13
 *          check digit (GS1 examples) and the full 95-module pattern of 5901234123457, and that invalid input is
 *          refused.
 * Boundary: pure functions, no DOM.
 * Runtime: node
 * Governing contract: ISO/IEC 15417; ISO/IEC 15420; ADR 0022 (test placement); STA-1371 (wave D).
 */
import { CODE128_PATTERNS } from "#core/constants/code128-patterns.constant";
import { barcodeOf } from "#core/functions/barcode-of.function";
import { code128CodesOf } from "#core/functions/code128-codes-of.function";
import { code128ModulesOf } from "#core/functions/code128-modules-of.function";
import { ean13CheckDigitOf } from "#core/functions/ean13-check-digit-of.function";
import { ean13ModulesOf } from "#core/functions/ean13-modules-of.function";

/** The widely published modules of EAN-13 5901234123457, guards and centre included. */
const EAN_5901234123457 = [
  "101",
  // 9 0 1 2 3 4 in L G G L L G (the parity of the leading 5)
  "0001011",
  "0100111",
  "0110011",
  "0010011",
  "0111101",
  "0011101",
  "01010",
  // 1 2 3 4 5 7 in R
  "1100110",
  "1101100",
  "1000010",
  "1011100",
  "1001110",
  "1000100",
  "101",
].join("");

/** How many modules a run of widths covers. */
const modulesOf = (widths: string) => [...widths].reduce((sum, width) => sum + Number(width), 0);

describe("Code 128", () => {
  it("has 107 distinct symbols of 11 modules, and a 13-module stop", () => {
    expect(CODE128_PATTERNS).toHaveLength(107);
    expect(new Set(CODE128_PATTERNS).size).toBe(107);
    CODE128_PATTERNS.slice(0, 106).forEach((widths) => expect(modulesOf(widths)).toBe(11));
    expect(modulesOf(CODE128_PATTERNS[106] ?? "")).toBe(13);
  });

  it("encodes text in subset B with the mod-103 check", () => {
    // P J J 1 2 3 C → 48 42 42 17 18 19 35; (104 + 48·1 + 42·2 + 42·3 + 17·4 + 18·5 + 19·6 + 35·7) mod 103 = 55.
    expect(code128CodesOf("PJJ123C")).toEqual([104, 48, 42, 42, 17, 18, 19, 35, 55, 106]);
  });

  it("uses subset C for digit pairs", () => {
    // (105 + 12·1 + 34·2 + 56·3) mod 103 = 44.
    expect(code128CodesOf("123456")).toEqual([105, 12, 34, 56, 44, 106]);
    // Six trailing digits switch to C; an odd leading run sends its first digit through B.
    expect(code128CodesOf("AB123456")?.slice(0, 7)).toEqual([104, 33, 34, 99, 12, 34, 56]);
    expect(code128CodesOf("12345")?.slice(0, 5)).toEqual([104, 17, 99, 23, 45]);
    // Four digits in the middle stay in B.
    expect(code128CodesOf("A1234B")?.slice(0, 7)).toEqual([104, 33, 17, 18, 19, 20, 34]);
  });

  it("draws bars that start and end with a bar and end with the stop", () => {
    const modules = code128ModulesOf("SKU-2048") ?? "";
    const codes = code128CodesOf("SKU-2048") ?? [];
    expect(modules).toHaveLength((codes.length - 1) * 11 + 13);
    expect(modules.startsWith("11010010000")).toBe(true); // start B
    expect(modules.endsWith("1100011101011")).toBe(true); // stop
  });

  it("refuses empty text and characters outside printable ASCII", () => {
    expect(code128CodesOf("")).toBeNull();
    expect(code128CodesOf("abaya é")).toBeNull();
    expect(code128CodesOf("line\nbreak")).toBeNull();
    expect(code128ModulesOf("عباية")).toBeNull();
  });
});

describe("EAN-13", () => {
  it("computes the check digit", () => {
    expect(ean13CheckDigitOf("400638133393")).toBe(1);
    expect(ean13CheckDigitOf("590123412345")).toBe(7);
    expect(ean13CheckDigitOf("629104150021")).toBe(3);
    expect(ean13CheckDigitOf("12345")).toBeNull();
  });

  it("draws the reference pattern of 5901234123457", () => {
    expect(ean13ModulesOf("5901234123457")).toEqual({
      modules: EAN_5901234123457,
      digits: "5901234123457",
    });
    expect(EAN_5901234123457).toHaveLength(95);
  });

  it("adds the check digit to twelve digits and refuses a wrong one", () => {
    expect(ean13ModulesOf("590123412345")?.digits).toBe("5901234123457");
    expect(ean13ModulesOf("5901234123458")).toBeNull();
    expect(ean13ModulesOf("59012341234")).toBeNull();
    expect(ean13ModulesOf("59012341234a")).toBeNull();
  });
});

describe("barcodeOf", () => {
  it("joins runs of bars into rectangles inside a ten-module quiet zone", () => {
    const drawing = barcodeOf("5901234123457", "ean13", 50);
    expect(drawing?.width).toBe(115);
    expect(drawing?.text).toBe("5901234123457");
    expect(drawing?.path.startsWith("M10 0h1v50h-1zM12 0h1v50h-1z")).toBe(true);
    expect(barcodeOf("SKU-2048", "code128", 40)?.text).toBe("SKU-2048");
  });

  it("returns null for an invalid value", () => {
    expect(barcodeOf("123", "ean13", 50)).toBeNull();
    expect(barcodeOf("", "code128", 50)).toBeNull();
  });
});
