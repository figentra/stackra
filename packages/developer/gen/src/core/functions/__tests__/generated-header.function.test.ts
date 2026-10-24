/**
 * Stackra file contract:
 * Purpose: unit tests of `generatedHeader`: the notice and its sources first, then the file contract, wrapped within
 *          116 columns with continuation lines indented under the text.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 10).
 */
import { describe, expect, it } from "@stackra/testing";

import { GENERATED_NOTICE } from "#core/constants/generated-notice.constant";
import { generatedHeader } from "#core/functions/generated-header.function";

describe("generatedHeader", () => {
  it("opens with the notice and carries the contract fields", () => {
    const header = generatedHeader({
      from: "src/node",
      purpose: "the wiring",
      boundary: "no logic",
      runtime: "node",
    });
    expect(header.split("\n")).toEqual([
      "/**",
      ` * ${GENERATED_NOTICE}; from src/node`,
      " * Purpose: the wiring",
      " * Boundary: no logic",
      " * Runtime: node",
      " */",
    ]);
  });

  it("wraps long text and indents continuation lines", () => {
    const header = generatedHeader({
      from: "x",
      purpose: "word ".repeat(60),
      boundary: "b",
      runtime: "isomorphic",
    });
    const lines = header.split("\n");
    expect(lines.every((line) => line.length <= 116)).toBe(true);
    const purpose = lines.findIndex((line) => line.startsWith(" * Purpose: "));
    expect(lines[purpose + 1]?.startsWith(" *          word")).toBe(true);
  });
});
