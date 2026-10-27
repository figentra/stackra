/**
 * Stackra file contract:
 * Purpose: the export list of the `.` entry of @stackra/support, so a public symbol is never added or dropped by
 *          accident.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as entry from "#core/index";

describe("@stackra/support", () => {
  it("exports exactly the public runtime symbols", () => {
    expect(Object.keys(entry).sort()).toEqual([
      "Quantity",
      "ageOn",
      "base64url",
      "camelCase",
      "canonicalHash",
      "canonicalJson",
      "code128",
      "crc32",
      "decodeBase64",
      "escapeHtml",
      "escapeXml",
      "htmlToText",
      "isRecord",
      "kebabCase",
      "oneTimeCode",
      "pascalCase",
      "restrictedGtin",
      "signedToken",
      "snakeCase",
      "time",
    ]);
  });
});
