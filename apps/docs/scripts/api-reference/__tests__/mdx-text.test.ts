/**
 * Stackra file contract:
 * Purpose: unit tests of the API reference's MDX helpers: `prose` escapes braces, `<` and line-start ESM keywords
 *          outside code and turns `{@link}` into code; code spans and fenced blocks pass through; `cell` keeps one
 *          line and escapes pipes; `inlineCode` and `codeBlock` pick delimiters the content cannot close.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0514; STA-2857.
 */
import { describe, expect, it } from "@stackra/testing";

import { cell } from "../cell.function";
import { codeBlock } from "../code-block.function";
import { inlineCode } from "../inline-code.function";
import { prose } from "../prose.function";

describe("prose", () => {
  it("escapes MDX syntax in plain text", () => {
    expect(prose("a {b} c <d>")).toBe("a \\{b\\} c &lt;d>");
  });

  it("leaves code spans and fenced blocks as written", () => {
    expect(prose("use `{ a: <b> }` now")).toBe("use `{ a: <b> }` now");
    expect(prose("see\n```ts\nconst a = { b: 1 };\n```\nand {c}")).toBe(
      "see\n```ts\nconst a = { b: 1 };\n```\nand \\{c\\}",
    );
  });

  it("turns links into code or their label", () => {
    expect(prose("a {@link Money} and {@link Money.of | the factory}")).toBe(
      "a `Money` and the factory",
    );
  });

  it("keeps a line that starts with import or export out of MDX's ESM", () => {
    expect(prose("first\nexport the file\n  import it")).toBe(
      "first\n&#101;xport the file\n  &#105;mport it",
    );
  });
});

describe("cell", () => {
  it("puts the text on one line and escapes pipes", () => {
    expect(cell("`a | b`\n  next")).toBe("`a \\| b` next");
  });
});

describe("inlineCode", () => {
  it("wraps plain code in one backtick", () => {
    expect(inlineCode("Money")).toBe("`Money`");
  });

  it("uses a longer delimiter, padded, around backticks", () => {
    expect(inlineCode("`${a}`")).toBe("`` `${a}` ``");
  });
});

describe("codeBlock", () => {
  it("fences code with a fence longer than any backtick run inside", () => {
    expect(codeBlock("const a = 1;", "ts")).toBe("```ts\nconst a = 1;\n```");
    expect(codeBlock("x\n```\ny", "ts")).toBe("````ts\nx\n```\ny\n````");
  });
});
