/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: exactly the two XLSX drivers, and a payroll sheet written as a
 *          workbook reads back through the XLSX reader.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); ADR 0431 (decisions 4 and 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { PAYROLL_EXPORT_PROFILE_SCHEMA, payrollSheet } from "#core/index";
import * as dataTransferNode from "#node/index";
import { XlsxReaderDriver, XlsxWriterDriver } from "#node/index";

describe("@stackra/data-transfer/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(dataTransferNode).sort()).toEqual(["XlsxReaderDriver", "XlsxWriterDriver"]);
  });

  it("writes a payroll workbook that reads back", async () => {
    const profile = PAYROLL_EXPORT_PROFILE_SCHEMA.parse({
      key: "zenhr-xlsx",
      provider: "zenhr",
      format: "xlsx",
      sheet: "Financial Transactions",
      decimalSeparator: ".",
      dateFormat: "iso",
      columns: [
        { header: "Employee Number", field: "employee" },
        { header: "Transaction Type", field: "code" },
        { header: "Amount", field: "amount" },
      ],
      codes: { tips: "TIPS" },
    });
    const sheet = payrollSheet(profile, [
      {
        employee: "7",
        item: "tips",
        periodStart: "2026-10-01",
        periodEnd: "2026-10-31",
        amount: 120.5,
      },
    ]);
    const chunks: Uint8Array[] = [];
    for await (const chunk of new XlsxWriterDriver().write([sheet])) chunks.push(chunk);
    const cells = [];
    for await (const row of new XlsxReaderDriver().read([Buffer.concat(chunks)]))
      cells.push(row.cells);
    expect(cells).toEqual([
      ["Employee Number", "Transaction Type", "Amount"],
      ["7", "TIPS", "120.5"],
    ]);
  });
});
