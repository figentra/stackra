/**
 * Stackra file contract:
 * Purpose: unit tests of `compileTypeScriptStep`: types are erased in place (positions kept), top-level `await` and
 *          `return` compile, and an `enum` or a syntax error is refused.
 * Boundary: test only; runs Node's type stripping.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0434 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { compileTypeScriptStep } from "#node/functions/compile-typescript-step.function";

describe(compileTypeScriptStep, () => {
  it("erases the types in place", () => {
    const source =
      "type Line = { amount: number };\nconst lines = (input as { lines: Line[] }).lines;\nawait Promise.resolve();\nreturn { total: lines.reduce((sum: number, line) => sum + line.amount, 0) };";
    const compiled = compileTypeScriptStep(source);
    expect(compiled).toHaveLength(source.length);
    expect(compiled).not.toMatch(/: number|as \{|type Line/);
    expect(compiled).toContain("return { total: lines.reduce((sum");
    expect(compiled.split("\n")).toHaveLength(source.split("\n").length);
  });

  it("refuses TypeScript that needs code generated, and a syntax error", () => {
    expect(() => compileTypeScriptStep("enum Kind { A }\nreturn Kind.A;")).toThrow(SyntaxError);
    expect(() => compileTypeScriptStep("return {;")).toThrow(SyntaxError);
  });
});
