/**
 * Stackra file contract:
 * Purpose: unit tests of `lineDiff`: equal texts give nothing, a changed line gives its `-` and `+` pair in order,
 *          and added or removed lines give only `+` or `-`.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1210 (`stackra new --over`).
 */
import { describe, expect, it } from "@stackra/testing";

import { lineDiff } from "#node/functions/line-diff.function";

describe("lineDiff", () => {
  it("is empty for equal texts", () => {
    expect(lineDiff("a\nb\n", "a\nb\n")).toBe("");
  });

  it("marks a changed line", () => {
    expect(lineDiff("a\nb\nc\n", "a\nx\nc\n")).toBe("-b\n+x\n");
  });

  it("marks added and removed lines", () => {
    expect(lineDiff("a\n", "a\nb\n")).toBe("+b\n");
    expect(lineDiff("a\nb\n", "b\n")).toBe("-a\n");
  });
});
