/**
 * Stackra file contract:
 * Purpose: unit tests of `payrollSheet`: headers, codes, literals, number and date formats per format, empty cells for
 *          absent values, and the refusal of a pay item the profile has no code for.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0431 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import type { TabularCell } from "#contracts/types/tabular-cell.type";
import type { TabularSheet } from "#contracts/types/tabular-sheet.type";
import { PAYROLL_EXPORT_PROFILE_SCHEMA } from "#core/constants/payroll-export-profile-schema.constant";
import { payrollSheet } from "#core/functions/payroll-sheet.function";
import type { PayInput } from "#core/types/pay-input.type";

const PROFILE = PAYROLL_EXPORT_PROFILE_SCHEMA.parse({
  key: "test",
  provider: "acme",
  format: "csv",
  sheet: "Pay",
  decimalSeparator: ",",
  dateFormat: "dd.mm.yyyy",
  columns: [
    { header: "No", field: "employee" },
    { header: "Code", field: "code" },
    { header: "From", field: "periodStart" },
    { header: "Hours", field: "quantity" },
    { header: "Amount", field: "amount" },
    { header: "Key", field: "literal", value: "1" },
  ],
  codes: { "hours.regular": "100" },
});

const INPUT: PayInput = {
  employee: "E-7",
  item: "hours.regular",
  periodStart: "2026-10-01",
  periodEnd: "2026-10-31",
  quantity: 8.5,
};

async function rows(sheet: TabularSheet): Promise<(readonly TabularCell[])[]> {
  const read: (readonly TabularCell[])[] = [];
  for await (const row of sheet.rows) read.push(row);
  return read;
}

describe("payrollSheet", () => {
  it("maps inputs through the profile", async () => {
    const sheet = payrollSheet(PROFILE, [INPUT]);
    expect(sheet.name).toBe("Pay");
    expect(await rows(sheet)).toEqual([
      ["No", "Code", "From", "Hours", "Amount", "Key"],
      ["E-7", "100", "01.10.2026", "8,5", null, "1"],
    ]);
  });

  it("keeps numbers for XLSX", async () => {
    const sheet = payrollSheet({ ...PROFILE, format: "xlsx", dateFormat: "iso" }, [INPUT]);
    expect((await rows(sheet))[1]).toEqual(["E-7", "100", "2026-10-01", 8.5, null, "1"]);
  });

  it("refuses an unmapped pay item", async () => {
    await expect(rows(payrollSheet(PROFILE, [{ ...INPUT, item: "tips" }]))).rejects.toThrow(
      /no acme code for pay item "tips"/,
    );
  });

  it("refuses a DATEV profile without its section and a literal without a value", () => {
    expect(
      PAYROLL_EXPORT_PROFILE_SCHEMA.safeParse({ ...PROFILE, format: "datev-ascii" }).success,
    ).toBe(false);
    expect(
      PAYROLL_EXPORT_PROFILE_SCHEMA.safeParse({
        ...PROFILE,
        columns: [{ header: "x", field: "literal" }],
      }).success,
    ).toBe(false);
  });
});
