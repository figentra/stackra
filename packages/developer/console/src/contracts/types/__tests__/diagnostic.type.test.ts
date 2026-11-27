/**
 * Stackra file contract:
 * Purpose: type tests of `Diagnostic` and `DiagnosticReport`: the nine fields, which are required (phase, severity,
 *          message) and which optional, the two severities, and the report's `ok` and read-only `diagnostics`.
 * Boundary: test only; types, through the `./contracts` barrel.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2886.
 */
import { describe, expect, expectTypeOf, it } from "vitest";

import type { Diagnostic, DiagnosticReport } from "#contracts/index";

describe("Diagnostic", () => {
  it("has the nine fields, phase, severity and message required", () => {
    expectTypeOf<keyof Diagnostic>().toEqualTypeOf<
      "phase" | "code" | "severity" | "file" | "line" | "column" | "message" | "fix" | "docsUrl"
    >();
    expectTypeOf<Diagnostic["severity"]>().toEqualTypeOf<"error" | "warning">();
    expectTypeOf<{ phase: "gen"; severity: "error"; message: "bad" }>().toExtend<Diagnostic>();
    expectTypeOf<{ phase: "gen"; message: "bad" }>().not.toExtend<Diagnostic>();
    expectTypeOf<{ severity: "error"; message: "bad" }>().not.toExtend<Diagnostic>();
    expectTypeOf<Diagnostic["line"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<Diagnostic["docsUrl"]>().toEqualTypeOf<string | undefined>();
  });

  it("carries every field a finding can have", () => {
    const diagnostic: Diagnostic = {
      phase: "gen",
      code: "shape_number_kind",
      severity: "error",
      file: "services/commerce/src/a.ts",
      line: 4,
      column: 3,
      message: "Orders.count: a number field needs @Int or @Num",
      fix: "add @Int",
      docsUrl: "https://docs.stackra.figentra.com/customers/error-codes#shapes-and-fields",
    };
    expect(Object.keys(diagnostic)).toHaveLength(9);
  });
});

describe("DiagnosticReport", () => {
  it("is ok and a read-only list of diagnostics", () => {
    expectTypeOf<keyof DiagnosticReport>().toEqualTypeOf<"ok" | "diagnostics">();
    expectTypeOf<DiagnosticReport["diagnostics"]>().toEqualTypeOf<readonly Diagnostic[]>();
    const report: DiagnosticReport = { ok: true, diagnostics: [] };
    expect(report.diagnostics).toEqual([]);
  });
});
