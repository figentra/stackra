/**
 * Stackra file contract:
 * Purpose: unit tests of `ExportAuditInput` and `ExportAuditOutput`: an optional time range coerced to dates, and a
 *          whole, non-negative exported count.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0328; STA-1579.
 */
import { describe, expect, it } from "@stackra/testing";
import { Schema } from "@stackra/validation";

import { ExportAuditInput } from "#node/schemas/export-audit-input.schema";
import { ExportAuditOutput } from "#node/schemas/export-audit-output.schema";

describe("ExportAuditInput", () => {
  it("takes no range or a range of dates", () => {
    expect(ExportAuditInput.create({})).toBeInstanceOf(Schema);
    const input = ExportAuditInput.create({ from: "2026-10-01T00:00:00Z" } as never);
    expect(input.from).toEqual(new Date("2026-10-01T00:00:00Z"));
    expect(input.to).toBeUndefined();
    expect(() => ExportAuditInput.create({ to: "not a date" } as never)).toThrow();
  });
});

describe("ExportAuditOutput", () => {
  it("holds a whole, non-negative count", () => {
    expect(ExportAuditOutput.create({ exported: 0 }).exported).toBe(0);
    expect(() => ExportAuditOutput.create({ exported: -1 })).toThrow();
    expect(() => ExportAuditOutput.create({ exported: 1.5 })).toThrow();
  });
});
