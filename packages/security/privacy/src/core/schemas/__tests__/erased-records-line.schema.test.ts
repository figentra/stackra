/**
 * Stackra file contract:
 * Purpose: unit tests of `ErasedRecordsLine`: a receipt line parses and an unknown method or a negative count is
 *          refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0189 (decision 2); STA-1299.
 */
import { describe, expect, it } from "@stackra/testing";

import { ErasureMethod } from "#contracts/enums/erasure-method.enum";
import { ErasedRecordsLine } from "#core/schemas/erased-records-line.schema";

describe("ErasedRecordsLine", () => {
  it("parses a receipt line", () => {
    const line = { kind: "crm.customer", method: ErasureMethod.Delete, count: 2 };
    expect(ErasedRecordsLine.create(line)).toMatchObject(line);
  });

  it("refuses an unknown method and a negative count", () => {
    expect(() =>
      ErasedRecordsLine.create({ kind: "crm.customer", method: "burn" as never, count: 1 }),
    ).toThrow();
    expect(() =>
      ErasedRecordsLine.create({ kind: "crm.customer", method: ErasureMethod.Delete, count: -1 }),
    ).toThrow();
  });
});
