/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ExportFormat`: an `Enum.of` enum whose codes are in source order, with a same-named
 *          type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ExportFormat } from "#core/enums/export-format.enum";

describe("ExportFormat", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(ExportFormat)).toEqual(["csv", "xlsx"]);
    expect(ExportFormat.Csv).toBe("csv");
  });

  it("types its values", () => {
    expectTypeOf<ExportFormat>().toEqualTypeOf<"csv" | "xlsx">();
  });
});
