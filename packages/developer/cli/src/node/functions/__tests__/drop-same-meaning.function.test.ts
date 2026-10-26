/**
 * Stackra file contract:
 * Purpose: unit tests of `dropSameMeaning`: a gen two_declarations_in_file finding on a file lint already reported under
 *          one-declaration-per-file is dropped and noted once; one on another file, or of another rule, stays.
 * Boundary: test only; pure function.
 * Runtime: node (vitest)
 * Governing contract: ADR 0282 (decision 3); ADR 0022 (test placement).
 */
import { describe, expect, it } from "vitest";

import { dropSameMeaning } from "#node/functions/drop-same-meaning.function";
import { toolFinding } from "#node/functions/tool-finding.function";

const LINT = { name: "lint", tool: "oxlint", adr: null };
const GEN = { name: "gen", tool: "gen", adr: null };

describe("dropSameMeaning", () => {
  it("keeps the lint finding, notes gen agrees once, and drops the gen repeat", () => {
    const lint = [
      toolFinding(LINT, {
        rule: "stackra(one-declaration-per-file)",
        path: "a.ts",
        message: "one",
      }),
      toolFinding(LINT, {
        rule: "stackra(one-declaration-per-file)",
        path: "a.ts",
        message: "two",
      }),
    ];
    const gen = [
      toolFinding(GEN, { rule: "two_declarations_in_file", path: "a.ts", message: "x" }),
      toolFinding(GEN, { rule: "two_declarations_in_file", path: "b.ts", message: "y" }),
      toolFinding(GEN, { rule: "stale", path: "a.ts", message: "z" }),
    ];
    const { earlier, incoming } = dropSameMeaning(lint, gen);
    expect(earlier.map((f) => f.message)).toEqual([
      "one (gen two_declarations_in_file agrees)",
      "two",
    ]);
    expect(incoming.map((f) => [f.rule, f.path])).toEqual([
      ["two_declarations_in_file", "b.ts"],
      ["stale", "a.ts"],
    ]);
    expect(lint[0]?.message).toBe("one");
  });
});
