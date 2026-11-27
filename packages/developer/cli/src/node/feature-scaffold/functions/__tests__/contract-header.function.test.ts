/**
 * Stackra file contract:
 * Purpose: unit tests of `contractHeader`: the four labelled fields, each wrapped at 120 columns with continuation
 *          lines aligned under the text.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); the file contract standard.
 */
import { describe, expect, it } from "@stackra/testing";

import { contractHeader } from "#node/feature-scaffold/functions/contract-header.function";

describe(contractHeader, () => {
  it("writes and wraps the four fields", () => {
    const header = contractHeader({
      purpose: `${"word ".repeat(30)}end.`,
      boundary: "data only.",
      runtime: "node",
      contract: "ADR 0294.",
    });
    const lines = header.split("\n");

    expect(lines[0]).toBe("/**");
    expect(lines[1]).toBe(" * Stackra file contract:");
    expect(lines[2]?.startsWith(" * Purpose: word")).toBe(true);
    expect(lines[3]?.startsWith(" *          word")).toBe(true);
    expect(lines.every((line) => line.length <= 120)).toBe(true);
    expect(lines.slice(-4)).toEqual([
      " * Boundary: data only.",
      " * Runtime: node",
      " * Governing contract: ADR 0294.",
      " */",
    ]);
  });
});
