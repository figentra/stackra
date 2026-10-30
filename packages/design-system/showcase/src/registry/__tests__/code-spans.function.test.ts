/**
 * Stackra file contract:
 * Purpose: proves `codeSpans` splits a description into prose and backticked code runs, dropping the backticks and
 *          leaving an unpaired backtick as prose.
 * Boundary: the pure function alone; no React.
 * Runtime: node
 * Governing contract: ADR 0060; ADR 0022 (test placement).
 */
import { describe, expect, it } from "vitest";

import { codeSpans } from "#src/registry/code-spans.function";

describe("codeSpans", () => {
  it("splits prose and code runs", () => {
    expect(codeSpans("مع `Drawer.Title`؛ أو `label`.")).toEqual([
      { text: "مع ", isCode: false },
      { text: "Drawer.Title", isCode: true },
      { text: "؛ أو ", isCode: false },
      { text: "label", isCode: true },
      { text: ".", isCode: false },
    ]);
  });

  it("keeps an unpaired backtick as prose", () => {
    expect(codeSpans("a ` b")).toEqual([{ text: "a ` b", isCode: false }]);
  });
});
