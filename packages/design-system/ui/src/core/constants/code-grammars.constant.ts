/**
 * Stackra file contract:
 * Purpose: `CODE_GRAMMARS`, the small highlighter's languages: ts, tsx (and js, jsx), json, css, html, bash, md, yaml,
 *          sql and diff, each an ordered list of sticky rules that `codeRowsOf` tries at every position, the first
 *          match winning; and the aliases a fence or prop may use (`typescript`, `sh`, `yml`, …).
 * Boundary: data and small pure classifiers. A regex lexer, not a parser: it colours what a reader scans for (keywords,
 *           strings, numbers, calls, types, properties, comments, tags, attributes) and leaves the rest plain. No
 *           lookbehind, so Hermes runs it on native.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one highlighter for web and native); STA-1371.
 */
import type { CodeGrammarRule } from "#core/types/code-grammar-rule.type";

/** The character before `at`, skipping spaces and tabs on the same line. */
const before = (source: string, at: number) => {
  let index = at - 1;
  while (index >= 0 && (source[index] === " " || source[index] === "\t")) index -= 1;
  return index < 0 ? "\n" : (source[index] ?? "\n");
};
/** The character at or after `at`, skipping spaces and tabs on the same line. */
const after = (source: string, at: number) => {
  let index = at;
  while (source[index] === " " || source[index] === "\t") index += 1;
  return source[index] ?? "\n";
};
const isLineStart = (source: string, at: number) => at === 0 || source[at - 1] === "\n";
/** A rule that applies only at the start of a line. */
const atLineStart =
  (role: "keyword" | "comment" | "punctuation" | "string" | "inserted" | "deleted" | "function") =>
  (_: string, source: string, at: number) =>
    isLineStart(source, at) ? role : null;
/** A rule that applies only after whitespace or at the start of a line (a `#` comment, a flag). */
const afterSpace = (role: "comment" | "attribute") => (_: string, source: string, at: number) =>
  at === 0 || /\s/.test(source[at - 1] ?? "") ? role : null;
const words = (list: string) => new Set(list.split(" "));
const sticky = (pattern: RegExp, at: number, source: string) => {
  pattern.lastIndex = at;
  return pattern.test(source);
};

const C_COMMENT = /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/y;
const BLOCK_COMMENT = /\/\*[\s\S]*?(?:\*\/|$)/y;
const QUOTED = /"(?:\\.|[^\\"\n])*"?|'(?:\\.|[^\\'\n])*'?/y;

const JS_KEYWORDS = words(
  "abstract as async await break case catch class const continue debugger declare default delete do else enum export extends false finally for from function get if implements import in infer instanceof interface is keyof let namespace new null of private protected public readonly return satisfies set static super switch this throw true try type typeof undefined unique var void while with yield",
);
const JS_TYPES = words("string number boolean bigint symbol object unknown never any");

/** A call's opening, generic arguments allowed: `(`, `<T>(`. */
const JS_CALL = /[ \t]*(?:<[^<>()\n]*>)?[ \t]*\(/y;

/** A JavaScript word: a keyword, a call, a property, an object key, a type, or plain. */
function jsWord(word: string, source: string, at: number) {
  const end = at + word.length;
  const isCall = sticky(JS_CALL, end, source);
  if (source[at - 1] === ".") return isCall ? "function" : "variable";
  if (JS_KEYWORDS.has(word)) return "keyword";
  if (isCall) return "function";
  if (JS_TYPES.has(word) || /^[A-Z]/.test(word)) return "type";
  if (after(source, end) === ":" && source[end + 1] !== ":" && "{,\n".includes(before(source, at)))
    return "variable";
  return "plain";
}

const JS: readonly CodeGrammarRule[] = [
  [C_COMMENT, "comment"],
  [/`(?:\\[\s\S]|[^\\`])*`?/y, "string"],
  [QUOTED, "string"],
  [/(?:0[xXbBoO][\da-fA-F_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)n?/y, "number"],
  [/[A-Za-z_$][\w$]*/y, jsWord],
  [/=>|\.\.\.|[=!]==?|[<>]=?|&&=?|\|\|=?|\?\?=?|\?\.|[-+*/%&|^~!?]=?/y, "operator"],
  [/[{}()[\];,.:]/y, "punctuation"],
];

/** A JSX tag: `<Name` or `</Name`, but not a generic (`Array<T>`) or a comparison (`a<b`). */
const jsxTag = (match: string, source: string, at: number) =>
  !match.startsWith("</") && /[\w$)\]]/.test(source[at - 1] ?? "") ? null : "tag";

const JSX: readonly CodeGrammarRule[] = [
  [C_COMMENT, "comment"],
  [/<\/?[A-Za-z][\w.:-]*/y, jsxTag],
  [/[A-Za-z_][\w-]*(?==[{"'])/y, "attribute"],
  ...JS.slice(1),
];

const JSON_RULES: readonly CodeGrammarRule[] = [
  [C_COMMENT, "comment"],
  [
    /"(?:\\.|[^\\"\n])*"?/y,
    (match, source, at) => (after(source, at + match.length) === ":" ? "variable" : "string"),
  ],
  [/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y, "number"],
  [/[A-Za-z_]\w*/y, (word) => (/^(?:true|false|null)$/.test(word) ? "keyword" : "plain")],
  [/[{}[\],:]/y, "punctuation"],
];

const CSS_DECLARATION = /\s*:[^{};]*(?:[;}]|$)/y;
const CSS_SELECTOR = /[^;{}]*\{/y;

/** A CSS word: a function, a property, a selector's element or plain (a value). */
function cssWord(word: string, source: string, at: number) {
  const end = at + word.length;
  if (source[end] === "(") return "function";
  if (sticky(CSS_DECLARATION, end, source)) return "variable";
  if (sticky(CSS_SELECTOR, end, source)) return "tag";
  return "plain";
}

const CSS: readonly CodeGrammarRule[] = [
  [BLOCK_COMMENT, "comment"],
  [QUOTED, "string"],
  [/@[\w-]+|!important\b/y, "keyword"],
  [
    /[.#][A-Za-z_-][\w-]*/y,
    (match, source, at) => (sticky(CSS_SELECTOR, at + match.length, source) ? "attribute" : null),
  ],
  [/#[\da-fA-F]{3,8}\b/y, "number"],
  [/-?(?:\d+\.?\d*|\.\d+)(?:[a-zA-Z%]+)?/y, "number"],
  [/--[\w-]+|-?[A-Za-z_][\w-]*/y, cssWord],
  [/[{}();:,]/y, "punctuation"],
  [/[>+~*=]/y, "operator"],
];

/** True inside a tag's angle brackets, where quotes are attribute values (outside, an apostrophe is prose). */
const inTag = (source: string, at: number) =>
  source.lastIndexOf("<", at) > source.lastIndexOf(">", at - 1);

const HTML: readonly CodeGrammarRule[] = [
  [/<!--[\s\S]*?(?:-->|$)/y, "comment"],
  [/<![A-Za-z][^>]*>/y, "keyword"],
  [/<\/?[A-Za-z][\w:-]*/y, "tag"],
  [/\/?>/y, "tag"],
  // shortcut: the inside of <script> and <style> stays plain; highlight it as its own block when it matters.
  [/[A-Za-z_:@][\w:.-]*(?=\s*=)/y, (_, source, at) => (inTag(source, at) ? "attribute" : null)],
  [/"[^"]*"?|'[^']*'?/y, (_, source, at) => (inTag(source, at) ? "string" : null)],
  [/&#?\w+;/y, "number"],
  [/[A-Za-z_][\w-]*/y, "plain"],
  [/=/y, "punctuation"],
];

const SHELL_KEYWORDS = words(
  "if then else elif fi for while until do done case esac in function return export local readonly unset select time",
);

/** A shell word: a keyword, the command of a pipeline step, a number or plain. */
function shellWord(word: string, source: string, at: number) {
  if (SHELL_KEYWORDS.has(word)) return "keyword";
  if (/^\d+$/.test(word)) return "number";
  const previous = before(source, at);
  if (
    "\n|;&(".includes(previous) ||
    /\b(?:sudo|then|do|else|exec|xargs)\s+$/.test(source.slice(Math.max(0, at - 8), at))
  )
    return "function";
  return "plain";
}

const BASH: readonly CodeGrammarRule[] = [
  [/#[^\n]*/y, afterSpace("comment")],
  [/"(?:\\[\s\S]|[^\\"])*"?|'[^']*'?/y, "string"],
  [/\$\{[^}\n]*\}?|\$[\w@#?$!*-]+/y, "variable"],
  [/[A-Za-z_]\w*(?==)/y, "variable"],
  [/--?[\w-]+/y, afterSpace("attribute")],
  [/[\w./~@:%+,-]+/y, shellWord],
  [/&&|\|\||[|;&<>]+|=/y, "operator"],
  [/\\$/my, "punctuation"],
];

const YAML: readonly CodeGrammarRule[] = [
  [/#[^\n]*/y, afterSpace("comment")],
  [/(?:---|\.\.\.)(?=\s*$)/my, atLineStart("punctuation")],
  [
    /(?:"(?:\\.|[^\\"\n])*"|'[^'\n]*'|[^\s#:"'\-[\]{},][^\n:#]*?)(?=[ \t]*:(?:\s|$))/y,
    (_, source, at) =>
      /^[\t -]*$/.test(source.slice(source.lastIndexOf("\n", at - 1) + 1, at)) ? "variable" : null,
  ],
  [QUOTED, "string"],
  [/[&*][\w-]+|!!?[\w-]+/y, "type"],
  [/-?\d+(?:\.\d+)?(?![\w.])/y, "number"],
  [
    /[A-Za-z_][\w.-]*/y,
    (word) => (/^(?:true|false|yes|no|on|off|null)$/i.test(word) ? "keyword" : "plain"),
  ],
  [/~/y, "keyword"],
  [/[-:[\]{},|>?]/y, "punctuation"],
];

const MARKDOWN: readonly CodeGrammarRule[] = [
  [/(?:```|~~~)[^\n]*(?:\n[\s\S]*?)?(?:\n(?:```|~~~)[ \t]*(?=\n|$)|$)/y, atLineStart("string")],
  [/#{1,6}[ \t][^\n]*/y, atLineStart("keyword")],
  [/(?:-{3,}|\*{3,}|_{3,})[ \t]*(?=\n|$)/y, atLineStart("punctuation")],
  [/[ \t]*(?:[-*+]|\d+[.)]|>)(?=[ \t])/y, atLineStart("punctuation")],
  [/`[^`\n]+`/y, "string"],
  [/\*\*[^*\n]+\*\*|__[^_\n]+__/y, "type"],
  [
    /\*[^*\s][^*\n]*\*|_[^_\s][^_\n]*_/y,
    (_, source, at) => (/\w/.test(source[at - 1] ?? "") ? null : "variable"),
  ],
  [/!?\[[^\]\n]*\]\([^)\n]*\)/y, "function"],
  [/<[A-Za-z][^>\n]*>/y, "tag"],
  [/\w+/y, "plain"],
];

const SQL_KEYWORDS = words(
  "add all alter and any as asc begin between by cascade case check commit constraint create cross default delete desc distinct drop else end exists false foreign from full grant group having if in index inner insert intersect into is join key left like limit not null offset on or order outer primary references returning right rollback select set table then to true truncate union unique update using values view when where with",
);
const SQL_TYPES = words(
  "bigint bigserial bit blob bool boolean char date datetime decimal double float int integer interval json jsonb money numeric real serial smallint text time timestamp timestamptz uuid varchar",
);

const SQL: readonly CodeGrammarRule[] = [
  [/--[^\n]*/y, "comment"],
  [BLOCK_COMMENT, "comment"],
  [/'(?:''|[^'])*'?/y, "string"],
  [/"[^"\n]*"?|`[^`\n]*`?/y, "variable"],
  [/\d+(?:\.\d+)?/y, "number"],
  [
    /[A-Za-z_][\w$]*/y,
    (word, source, at) => {
      const lower = word.toLowerCase();
      if (source[at - 1] === ".") return "variable";
      if (SQL_KEYWORDS.has(lower)) return "keyword";
      if (SQL_TYPES.has(lower)) return "type";
      return source[at + word.length] === "(" ? "function" : "plain";
    },
  ],
  [/<>|!=|<=|>=|\|\||::|[=<>+\-*/%]/y, "operator"],
  [/[(),;.]/y, "punctuation"],
];

const DIFF: readonly CodeGrammarRule[] = [
  [/(?:\+\+\+|---|diff |index )[^\n]*/y, atLineStart("keyword")],
  [/@@[^\n]*/y, atLineStart("function")],
  [/\+[^\n]*/y, atLineStart("inserted")],
  [/-[^\n]*/y, atLineStart("deleted")],
  [/[^\n]+/y, "plain"],
];

/** The grammar of each language name and alias; an unknown language is drawn plain. */
export const CODE_GRAMMARS: Readonly<Record<string, readonly CodeGrammarRule[]>> = {
  ts: JS,
  typescript: JS,
  js: JS,
  javascript: JS,
  mjs: JS,
  cjs: JS,
  tsx: JSX,
  jsx: JSX,
  json: JSON_RULES,
  jsonc: JSON_RULES,
  json5: JSON_RULES,
  css: CSS,
  scss: CSS,
  html: HTML,
  xml: HTML,
  svg: HTML,
  bash: BASH,
  sh: BASH,
  shell: BASH,
  zsh: BASH,
  console: BASH,
  md: MARKDOWN,
  markdown: MARKDOWN,
  mdx: MARKDOWN,
  yaml: YAML,
  yml: YAML,
  sql: SQL,
  postgres: SQL,
  postgresql: SQL,
  mysql: SQL,
  sqlite: SQL,
  diff: DIFF,
  patch: DIFF,
};
