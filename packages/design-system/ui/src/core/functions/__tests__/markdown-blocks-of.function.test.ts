/**
 * Stackra file contract:
 * Purpose: proves `markdownBlocksOf` on its edges: an unclosed fence runs to the end, a fence without a language,
 *          CRLF and CR line ends, heading levels one to three (a fourth reads as a paragraph), an ordered list that
 *          stops at a bullet, a quote of several lines, blank lines skipped, Arabic text kept, and empty input.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { markdownBlocksOf } from "#core/functions/markdown-blocks-of.function";

describe("markdownBlocksOf", () => {
  it("gives no blocks for empty or blank input", () => {
    expect(markdownBlocksOf("")).toEqual([]);
    expect(markdownBlocksOf("\n  \n")).toEqual([]);
  });

  it("reads fenced code, with or without a language, closed or not", () => {
    expect(markdownBlocksOf("```ts\nconst a = 1;\n```")).toEqual([
      { kind: "code", language: "ts", code: "const a = 1;" },
    ]);
    expect(markdownBlocksOf("```\nline 1\r\nline 2")).toEqual([
      { kind: "code", language: "", code: "line 1\nline 2" },
    ]);
  });

  it("reads headings one to three, and a deeper one as a paragraph", () => {
    expect(markdownBlocksOf("# One\r## Two\n### ثلاثة  \n#### Four")).toEqual([
      { kind: "heading", level: 1, text: "One" },
      { kind: "heading", level: 2, text: "Two" },
      { kind: "heading", level: 3, text: "ثلاثة" },
      { kind: "paragraph", text: "#### Four" },
    ]);
  });

  it("splits an ordered list from a bullet list that follows it", () => {
    expect(markdownBlocksOf("1. one\n2) two\n- three\n* four")).toEqual([
      { kind: "list", isOrdered: true, items: ["one", "two"] },
      { kind: "list", isOrdered: false, items: ["three", "four"] },
    ]);
  });

  it("joins a quote's lines and a paragraph's lines, stopping at the next block", () => {
    expect(markdownBlocksOf("> first\n>second\n\nplain\n  more\n# Next")).toEqual([
      { kind: "quote", text: "first second" },
      { kind: "paragraph", text: "plain more" },
      { kind: "heading", level: 1, text: "Next" },
    ]);
  });
});
