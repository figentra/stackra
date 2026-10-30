/**
 * Stackra file contract:
 * Purpose: proves the context rules of `CODE_GRAMMARS` through `codeTokensOf`: a method call and a property after a
 *          dot, an object key after a tab, JSON words, CSS functions, HTML text outside a tag, shell keywords, numbers
 *          and `#` that is not a comment, YAML keys and markers away from the line start, and Markdown emphasis
 *          inside a word.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one highlighter for web and native); ADR 0022 (test placement); STA-1371.
 */
import { CODE_GRAMMARS } from "#core/constants/code-grammars.constant";
import { codeTokensOf } from "#core/functions/code-tokens-of.function";

/** The runs of `code` that have a role, as `role:text`. */
const runs = (code: string, language: string) =>
  codeTokensOf(code, language)
    .flat()
    .filter((token) => token.role && token.role !== "punctuation" && token.role !== "operator")
    .map((token) => `${token.role}:${token.text}`);

describe("CODE_GRAMMARS", () => {
  it("maps every alias to a grammar", () => {
    for (const rules of Object.values(CODE_GRAMMARS)) expect(rules.length).toBeGreaterThan(0);
    expect(CODE_GRAMMARS["patch"]).toBe(CODE_GRAMMARS["diff"]);
  });

  it("colours a method call apart from a property, and a key after a tab", () => {
    expect(runs("list.map(fn).size", "js")).toEqual(["function:map", "variable:size"]);
    expect(runs("({\n\tid: 1 })", "js")).toEqual(["variable:id", "number:1"]);
    expect(runs("a ? b : c", "js")).toEqual([]);
  });

  it("colours JSON words that are not literals as plain", () => {
    expect(runs("{ ok: true }", "json")).toEqual(["keyword:true"]);
  });

  it("colours a CSS function", () => {
    expect(runs("a { color: rgb(0 0 0); }", "css")).toContain("function:rgb");
  });

  it("leaves HTML text outside a tag uncoloured", () => {
    expect(runs("<p>it's x=1</p>", "html")).toEqual(["tag:<p>", "tag:</p>"]);
  });

  it("colours shell keywords, numbers and only a spaced #", () => {
    expect(runs("if true; then exit 1; fi", "bash")).toEqual([
      "keyword:if",
      "keyword:then",
      "function:exit",
      "number:1",
      "keyword:fi",
    ]);
    expect(runs("echo a#b", "sh")).toEqual(["function:echo"]);
  });

  it("keeps a YAML key and a document marker to the line start", () => {
    expect(runs("a: x: y", "yaml")).toEqual(["variable:a"]);
    expect(runs("key: ---", "yaml")).toEqual(["variable:key"]);
  });

  it("leaves Markdown emphasis inside a word uncoloured", () => {
    expect(runs("snake_case_name and *this*", "md")).toEqual(["variable:*this*"]);
  });
});
