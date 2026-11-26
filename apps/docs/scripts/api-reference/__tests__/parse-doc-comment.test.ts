/**
 * Stackra file contract:
 * Purpose: unit tests of `parseDocComment`: the summary (text on the opener line included), `@param` in its written
 *          forms, `@returns`, `@throws`, `@deprecated`, `@remarks`, `@typeParam`, `@internal`; an `@example` keeps
 *          decorator lines and fenced code; an unknown `@word` is text, never a new block.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0007 (docblock standard); STA-2857.
 */
import { describe, expect, it } from "@stackra/testing";

import { EMPTY_DOC } from "../empty-doc.constant";
import { parseDocComment } from "../parse-doc-comment.function";

describe("parseDocComment", () => {
  it("reads a one-line comment as the summary", () => {
    expect(parseDocComment("/** The amount in minor units. */")).toEqual({
      ...EMPTY_DOC,
      summary: "The amount in minor units.",
    });
  });

  it("reads the summary, params, returns, throws and examples of a block", () => {
    const doc = parseDocComment(
      [
        "/**",
        " * Adds two amounts.",
        " *",
        " * Both must share a currency.",
        " *",
        " * @param left - the first amount.",
        " * @param right the second amount,",
        " *   continued on the next line.",
        " * @param {number} [scale=2] - legacy JSDoc form.",
        " * @returns the sum.",
        " * @throws RangeError when the currencies differ.",
        " * @example",
        " * add(a, b);",
        " *   // indented comment",
        " */",
      ].join("\n"),
    );
    expect(doc.summary).toBe("Adds two amounts.\n\nBoth must share a currency.");
    expect(doc.params).toEqual([
      { name: "left", text: "the first amount." },
      { name: "right", text: "the second amount,\n  continued on the next line." },
      { name: "scale", text: "legacy JSDoc form." },
    ]);
    expect(doc.returns).toBe("the sum.");
    expect(doc.throws).toEqual(["RangeError when the currencies differ."]);
    expect(doc.examples).toEqual(["add(a, b);\n  // indented comment"]);
  });

  it("keeps decorator lines inside an example instead of reading them as tags", () => {
    const doc = parseDocComment(
      [
        "/**",
        " * Trims a field.",
        " *",
        " * @example",
        " * @Trim",
        " * @Str({ max: 120 })",
        " * name!: string;",
        " */",
      ].join("\n"),
    );
    expect(doc.examples).toEqual(["@Trim\n@Str({ max: 120 })\nname!: string;"]);
  });

  it("never starts a block inside a fence", () => {
    const doc = parseDocComment(
      [
        "/**",
        " * Example with a fence.",
        " * @example",
        " * ```ts",
        " * @param not-a-tag",
        " * ```",
        " * @returns after the fence.",
        " */",
      ].join("\n"),
    );
    expect(doc.examples).toEqual(["```ts\n@param not-a-tag\n```"]);
    expect(doc.params).toEqual([]);
    expect(doc.returns).toBe("after the fence.");
  });

  it("reads deprecation, remarks, type parameters, see, default and internal", () => {
    const doc = parseDocComment(
      [
        "/**",
        " * Old API.",
        " * @remarks Kept for one release.",
        " * @typeParam T - the item type.",
        " * @deprecated use `next` instead.",
        " * @see next",
        " * @defaultValue `false`",
        " * @internal",
        " */",
      ].join("\n"),
    );
    expect(doc).toMatchObject({
      summary: "Old API.",
      remarks: "Kept for one release.",
      typeParams: [{ name: "T", text: "the item type." }],
      deprecated: "use `next` instead.",
      see: ["next"],
      defaultValue: "`false`",
      internal: true,
    });
  });

  it("marks a bare @deprecated with empty text", () => {
    expect(parseDocComment("/**\n * Gone.\n * @deprecated\n */").deprecated).toBe("");
  });
});
