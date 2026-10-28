/**
 * Stackra file contract:
 * Purpose: unit tests of the export shapes: `ExportOptions` applies its defaults (500 per page, 100,000 rows, A4
 *          landscape PDF of 5,000 rows); `ExportInput` takes a format, row paths and one or up to three sort keys, and
 *          refuses no columns, a bad path and an unknown format; `ExportOutput` carries the link, expiry and counts.
 * Boundary: test only; validates through @stackra/validation.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 10); ADR 0363.
 */
import { describe, expect, it } from "@stackra/testing";
import { validate } from "@stackra/validation";

import { ExportInput } from "#node/schemas/export-input.schema";
import { ExportOptions } from "#node/schemas/export-options.schema";
import { ExportOutput } from "#node/schemas/export-output.schema";

describe("export shapes", () => {
  it("defaults the export options", () => {
    const result = validate(ExportOptions, {});
    expect(result.success).toBe(true);
    if (result.success)
      expect(result.data).toMatchObject({
        pageSize: 500,
        maxRows: 100_000,
        folder: "exports",
        pdfPage: { widthMm: 297, heightMm: 210, marginMm: 10 },
        pdfMaxRows: 5000,
      });
  });

  it("takes an export request and refuses a bad one", () => {
    const base = { format: "xlsx", columns: ["number", "totals.totalMinor"] };
    expect(validate(ExportInput, base).success).toBe(true);
    expect(
      validate(ExportInput, {
        ...base,
        sort: [
          { key: "status", direction: "asc" },
          { key: "number", direction: "desc" },
        ],
      }).success,
    ).toBe(true);
    expect(validate(ExportInput, { ...base, columns: [] }).success).toBe(false);
    expect(validate(ExportInput, { ...base, columns: ["a b"] }).success).toBe(false);
    expect(validate(ExportInput, { ...base, format: "docx" }).success).toBe(false);
  });

  it("carries the link, its expiry and the counts", () => {
    expect(
      validate(ExportOutput, {
        link: "https://disk.test/signed",
        expiresAt: "2026-10-29T09:00:00.000Z",
        rows: 3,
        truncated: false,
      }).success,
    ).toBe(true);
    expect(
      validate(ExportOutput, { link: "", expiresAt: "x", rows: -1, truncated: false }).success,
    ).toBe(false);
  });
});
