/**
 * Stackra file contract:
 * Purpose: proves the highlighter's output for each language (the coloured runs of a typical line), plain fallback,
 *          lines kept apart, and `codeRowsOf`'s highlighted lines, diff markers and copy text.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: STA-1371.
 */
import { codeRowsOf } from "#core/functions/code-rows-of.function";
import { codeTextOf } from "#core/functions/code-text-of.function";
import { codeTokensOf } from "#core/functions/code-tokens-of.function";
import { lineSetOf } from "#core/functions/line-set-of.function";

/** The coloured runs of `code`, as `role:text`. */
const runs = (code: string, language: string) =>
  codeTokensOf(code, language)
    .flat()
    .filter((token) => token.role && token.role !== "punctuation" && token.role !== "operator")
    .map((token) => `${token.role}:${token.text}`);

describe("codeTokensOf", () => {
  it("colours TypeScript", () => {
    expect(
      runs('export const total: number = sumOf(lines).value; // net\nconst label = "SAR";', "ts"),
    ).toEqual([
      "keyword:export",
      "keyword:const",
      "type:number",
      "function:sumOf",
      "variable:value",
      "comment:// net",
      "keyword:const",
      'string:"SAR"',
    ]);
  });

  it("colours TSX tags and attributes, but not generics", () => {
    expect(runs('<Button variant="primary" onPress={go}>Pay</Button>', "tsx")).toEqual([
      "tag:<Button",
      "attribute:variant",
      'string:"primary"',
      "attribute:onPress",
      // shortcut: JSX text reads as a word; a capitalised one takes the type colour.
      "type:Pay",
      "tag:</Button",
    ]);
    expect(runs("useState<string>(0)", "tsx")).toEqual([
      "function:useState",
      "type:string",
      "number:0",
    ]);
  });

  it("colours JSON keys apart from values", () => {
    expect(runs('{ "id": "ord_1", "total": 186.5, "paid": true, "note": null }', "json")).toEqual([
      'variable:"id"',
      'string:"ord_1"',
      'variable:"total"',
      "number:186.5",
      'variable:"paid"',
      "keyword:true",
      'variable:"note"',
      "keyword:null",
    ]);
  });

  it("colours CSS selectors, properties, values and at-rules", () => {
    expect(
      runs("@media (width > 40rem) {\n  .card:hover { color: #fff; margin: 0 auto; }\n}", "css"),
    ).toEqual([
      "keyword:@media",
      "tag:width",
      "number:40rem",
      "attribute:.card",
      "tag:hover",
      "variable:color",
      "number:#fff",
      "variable:margin",
      "number:0",
    ]);
  });

  it("colours HTML tags, attributes and their values, not prose apostrophes", () => {
    expect(runs('<!-- note -->\n<a href="/pay">Don\'t wait</a>', "html")).toEqual([
      "comment:<!-- note -->",
      "tag:<a",
      "attribute:href",
      'string:"/pay"',
      "tag:>",
      "tag:</a>",
    ]);
  });

  it("colours shell commands, flags, variables and comments", () => {
    expect(runs('pnpm add -D vitest && echo "$HOME" # done', "bash")).toEqual([
      "function:pnpm",
      "attribute:-D",
      "function:echo",
      'string:"$HOME"',
      "comment:# done",
    ]);
  });

  it("colours Markdown headings, emphasis, code and links", () => {
    expect(runs("# Notes\n- **Fast** `search`, see [guide](https://x.dev)", "md")).toEqual([
      "keyword:# Notes",
      "type:**Fast**",
      "string:`search`",
      "function:[guide](https://x.dev)",
    ]);
  });

  it("colours YAML keys, values and comments", () => {
    expect(runs("name: stackra # app\nport: 3711\ndebug: false\nlist:\n  - 'a'", "yml")).toEqual([
      "variable:name",
      "comment:# app",
      "variable:port",
      "number:3711",
      "variable:debug",
      "keyword:false",
      "variable:list",
      "string:'a'",
    ]);
  });

  it("colours SQL keywords in any case, types, calls and strings", () => {
    expect(
      runs(
        "select count(*) from orders o where o.status = 'paid' -- now\nCREATE TABLE t (id uuid);",
        "sql",
      ),
    ).toEqual([
      "keyword:select",
      "function:count",
      "keyword:from",
      "keyword:where",
      "variable:status",
      "string:'paid'",
      "comment:-- now",
      "keyword:CREATE",
      "keyword:TABLE",
      "type:uuid",
    ]);
  });

  it("colours a unified diff", () => {
    expect(runs("@@ -1 +1 @@\n-old\n+new\n same", "diff")).toEqual([
      "function:@@ -1 +1 @@",
      "deleted:-old",
      "inserted:+new",
    ]);
  });

  it("keeps a multi-line comment on its own lines and draws an unknown language plain", () => {
    expect(codeTokensOf("/* a\nb */ x", "js")).toEqual([
      [{ text: "/* a", role: "comment" }],
      [{ text: "b */", role: "comment" }, { text: " x" }],
    ]);
    expect(codeTokensOf("a\nb", "cobol")).toEqual([[{ text: "a" }], [{ text: "b" }]]);
  });
});

describe("codeRowsOf", () => {
  it("marks highlighted lines from numbers and ranges", () => {
    expect([...lineSetOf([2, "4-6"])]).toEqual([2, 4, 5, 6]);
    const rows = codeRowsOf("a\nb\nc\n", { highlightLines: [2] });
    expect(rows.map((row) => row.isHighlighted)).toEqual([false, true, false]);
  });

  it("splits diff lines on their marker and copies the result", () => {
    const rows = codeRowsOf(" keep\n-old\n+new", { isDiff: true });
    expect(rows.map((row) => row.change)).toEqual([undefined, "deleted", "inserted"]);
    expect(codeTextOf(rows)).toBe("keep\nnew");
  });
});
