/**
 * Stackra file contract:
 * Purpose: `RICH_TEXT_HTML_POLICY`, the default `sanitizeHtml` policy: what the rich-text editor (TipTap's starter kit
 *          and link mark) produces — paragraphs, headings, lists, quotes, code, the inline marks and links — with `dir`
 *          on block text for right-to-left content.
 * Boundary: a frozen constant. No script, style, iframe, form, image, media or event-handler attribute is allowed;
 *           their content is dropped too where it could run or render (`script`, `style`, `template` and the like).
 * Runtime: isomorphic
 * Governing contract: OWASP XSS prevention; ADR 0466 (the rich-text schema); STA-2562 frontend audit item (b).
 */
import type { HtmlPolicy } from "#core/types/html-policy.type";

/** Block text that may carry a writing direction. */
const BLOCK = ["dir"];

/** The rich-text allowlist. */
export const RICH_TEXT_HTML_POLICY: HtmlPolicy = Object.freeze({
  tags: Object.freeze({
    p: BLOCK,
    h1: BLOCK,
    h2: BLOCK,
    h3: BLOCK,
    h4: BLOCK,
    h5: BLOCK,
    h6: BLOCK,
    blockquote: BLOCK,
    ul: BLOCK,
    ol: [...BLOCK, "start"],
    li: BLOCK,
    pre: BLOCK,
    code: [],
    strong: [],
    b: [],
    em: [],
    i: [],
    u: [],
    s: [],
    br: [],
    hr: [],
    a: ["href", "title"],
  }),
  dropWithContent: Object.freeze([
    "script",
    "style",
    "template",
    "noscript",
    "iframe",
    "object",
    "embed",
    "svg",
    "math",
    "textarea",
    "title",
    "xmp",
    "noembed",
    "noframes",
    "plaintext",
  ]),
});
