/**
 * Stackra file contract:
 * Purpose: `sanitizeHtml`, rich-text HTML made safe to render: the tags and attributes the policy allows are written
 *          back, everything else is dropped. A disallowed tag keeps its text; a script, style, template and the like
 *          lose their content too; comments, doctypes and processing instructions go; a link keeps an `href` only
 *          when it is http(s), mailto, relative or a fragment once entities and control characters are taken out.
 * Boundary: pure and isomorphic, no DOM. Safe by construction: the output is rebuilt from parsed parts, never copied, so
 *           markup the tokenizer does not recognise becomes escaped text, every attribute value is re-escaped, and
 *           every open tag is closed. Use it on any HTML from a client or a tenant before it is rendered, mailed or
 *           stored for rendering (`dangerouslySetInnerHTML`, an email body); ProseMirror JSON needs no pass.
 * Runtime: isomorphic
 * Governing contract: OWASP XSS prevention (allowlist sanitization); STA-2562 frontend audit item (b).
 */
import { RICH_TEXT_HTML_POLICY } from "#core/constants/rich-text-html-policy.constant";
import type { HtmlPolicy } from "#core/types/html-policy.type";

/** A comment, a declaration or processing instruction, or one tag with its attributes. */
const TOKEN =
  /<!--[\s\S]*?(?:-->|$)|<[!?][^>]*>?|<(\/?)([A-Za-z][A-Za-z0-9-]*)((?:\s+[^\s"'<>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/g;

/** One attribute: its name and its double-quoted, single-quoted or bare value. */
const ATTRIBUTE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

/** Tags that never have content or a closing tag. */
const VOID = new Set(["br", "hr"]);

/** The named entities decoded before a value is checked; any other stays as written. */
const NAMED: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  colon: ":",
  tab: "\t",
  newline: "\n",
};

/** `text` with its numeric and common named character references decoded, as a browser would. */
const decode = (text: string): string =>
  text.replaceAll(/&(#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z]+);?/g, (whole, name: string) => {
    if (!name.startsWith("#")) return NAMED[name.toLowerCase()] ?? whole;
    const hex = name[1] === "x" || name[1] === "X";
    const code = Number.parseInt(name.slice(hex ? 2 : 1), hex ? 16 : 10);
    return code > 0 && code <= 0x10_ff_ff && (code < 0xd8_00 || code > 0xdf_ff)
      ? String.fromCodePoint(code)
      : "�";
  });

/** `text` safe inside an element or a double-quoted attribute. */
const escape = (text: string): string =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/** Whether `href` (decoded) is a URL a link may open: http(s), mailto, or one with no scheme. */
const isSafeHref = (href: string): boolean => {
  // Browsers ignore control characters and spaces inside a scheme (`java\tscript:`).
  const clean = href.replaceAll(/[\s\p{Cc}]/gu, "");
  const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(clean)?.[1]?.toLowerCase();
  return scheme === undefined ? clean.length > 0 : ["http", "https", "mailto"].includes(scheme);
};

/** The ` name="value"` text of the attributes `allowed` keeps, each value checked and re-escaped. */
const attributesOf = (source: string, allowed: readonly string[]): string => {
  let kept = "";
  const seen = new Set<string>();
  for (const match of source.matchAll(ATTRIBUTE)) {
    const name = (match[1] ?? "").toLowerCase();
    if (!allowed.includes(name) || seen.has(name)) continue;
    const value = decode(match[2] ?? match[3] ?? match[4] ?? "");
    if (name === "href" && !isSafeHref(value)) continue;
    if (name === "dir" && !["ltr", "rtl", "auto"].includes(value.toLowerCase())) continue;
    if (name === "start" && !/^\d{1,9}$/.test(value)) continue;
    seen.add(name);
    kept += ` ${name}="${escape(value)}"`;
  }
  return kept;
};

/**
 * `html` with only what `policy` allows.
 *
 * @example
 * sanitizeHtml('<p onclick="x()">Hi <script>steal()</script><a href="javascript:x()">there</a></p>');
 * // "<p>Hi <a>there</a></p>"
 */
export function sanitizeHtml(html: string, policy: HtmlPolicy = RICH_TEXT_HTML_POLICY): string {
  const open: string[] = [];
  let out = "";
  let dropping: { readonly tag: string; depth: number } | undefined;
  let last = 0;
  const text = (raw: string): void => {
    if (dropping === undefined) out += escape(decode(raw));
  };
  for (const match of html.matchAll(TOKEN)) {
    text(html.slice(last, match.index));
    last = match.index + match[0].length;
    const tag = match[2]?.toLowerCase();
    if (tag === undefined) continue; // a comment, doctype or processing instruction
    const closing = match[1] === "/";
    if (dropping !== undefined) {
      if (tag === dropping.tag) dropping.depth += closing ? -1 : 1;
      if (dropping.depth === 0) dropping = undefined;
      continue;
    }
    if (policy.dropWithContent.includes(tag)) {
      if (!closing) dropping = { tag, depth: 1 };
      continue;
    }
    const allowed = Object.hasOwn(policy.tags, tag) ? policy.tags[tag] : undefined;
    if (allowed === undefined) continue;
    if (closing) {
      const at = open.lastIndexOf(tag);
      if (at < 0) continue;
      // oxlint-disable-next-line unicorn/no-array-reverse -- reverses the spliced copy, which nothing else holds; toReversed is ES2023 and the base lib is ES2022
      for (const name of open.splice(at).reverse()) out += `</${name}>`;
      continue;
    }
    out += `<${tag}${attributesOf(match[3] ?? "", allowed)}>`;
    if (!VOID.has(tag)) open.push(tag);
  }
  text(html.slice(last));
  // oxlint-disable-next-line unicorn/no-array-reverse -- the stack is done with here; toReversed is ES2023 and the base lib is ES2022
  for (const name of open.reverse()) out += `</${name}>`;
  return out;
}
