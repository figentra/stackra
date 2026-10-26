/**
 * Stackra file contract:
 * Purpose: unit tests of `sheetImportsOf` and `IMPORT_MAPPING_PROFILE_SCHEMA`: a seed profile parses and becomes sheet
 *          imports in its order, and a missing target or an empty profile is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0431 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import type { ImportTarget } from "#contracts/types/import-target.type";
import { IMPORT_MAPPING_PROFILE_SCHEMA } from "#core/constants/import-mapping-profile-schema.constant";
import { sheetImportsOf } from "#core/functions/sheet-imports-of.function";

const TARGET: ImportTarget<unknown> = {
  schema: z.unknown(),
  upsert: async () => [],
  revert: async () => undefined,
};

const PROFILE = IMPORT_MAPPING_PROFILE_SCHEMA.parse({
  key: "grocery.items",
  sheets: [
    { sheet: "Items", target: "items", mapping: { sku: "رمز الصنف" } },
    { sheet: "Barcodes", target: "barcodes", mapping: { sku: "SKU", code: "Barcode" } },
  ],
});

describe("sheetImportsOf", () => {
  it("builds the sheet imports in profile order", () => {
    expect(sheetImportsOf(PROFILE, { items: TARGET, barcodes: TARGET })).toEqual([
      { sheet: "Items", mapping: { sku: "رمز الصنف" }, target: TARGET },
      { sheet: "Barcodes", mapping: { sku: "SKU", code: "Barcode" }, target: TARGET },
    ]);
  });

  it("refuses a missing target and an empty profile", () => {
    expect(() => sheetImportsOf(PROFILE, { items: TARGET })).toThrow(/"barcodes"/);
    expect(IMPORT_MAPPING_PROFILE_SCHEMA.safeParse({ key: "x", sheets: [] }).success).toBe(false);
  });
});
