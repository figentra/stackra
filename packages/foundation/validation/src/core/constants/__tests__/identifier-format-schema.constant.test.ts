/**
 * Stackra file contract:
 * Purpose: unit tests of `IDENTIFIER_FORMAT_SCHEMA` (`IdentifierFormat$`): a pack format with a check and a canonical
 *          form parses; an unknown algorithm, a pattern that does not compile and a missing pattern are refused; the
 *          schema converts to JSON Schema for a pack section.
 * Boundary: test only; pure. The formats are test data shaped like a market pack's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); ADR 0417; STA-1269.
 */
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { IDENTIFIER_FORMAT_SCHEMA } from "#core/constants/identifier-format-schema.constant";

describe("IdentifierFormat$", () => {
  it("parses a pack format", () => {
    const format = { pattern: "^(\\d{2})(\\d{7})$", check: "luhn", canonical: "$1-$2" };
    expect(IDENTIFIER_FORMAT_SCHEMA.parse(format)).toEqual(format);
  });

  it("refuses an unknown algorithm, a broken pattern and no pattern", () => {
    expect(IDENTIFIER_FORMAT_SCHEMA.safeParse({ pattern: "^\\d+$", check: "crc" }).success).toBe(
      false,
    );
    expect(IDENTIFIER_FORMAT_SCHEMA.safeParse({ pattern: "^(\\d+$" }).success).toBe(false);
    expect(IDENTIFIER_FORMAT_SCHEMA.safeParse({ check: "luhn" }).success).toBe(false);
  });

  it("converts to JSON Schema for a pack section", () => {
    expect(z.toJSONSchema(IDENTIFIER_FORMAT_SCHEMA)).toMatchObject({ type: "object" });
  });
});
