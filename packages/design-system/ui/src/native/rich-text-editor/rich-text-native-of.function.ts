/**
 * Stackra file contract:
 * Purpose: `richTextNativeOf(value)`: a RichTextEditor value in the form the native editor (tentap's bundled TipTap)
 *          loads, and whether loading it there would lose something, so the native editor turns read-only for it.
 * Boundary: pure. JSON loses its `dir` attributes (the bundled schema has none; the native editor lays each block out
 *           by its own text, and `richTextReportedOf` puts `dir: "auto"` back); a node or mark the bundled schema
 *           lacks (a code block, a rule, a contributed node) is shown as its text and marks the value lossy, because
 *           TipTap would otherwise load an empty document. HTML passes as is; a tag outside the schema marks it lossy.
 * Runtime: isomorphic
 * Governing contract: ADR 0466 (decisions 1, 2 and 8); STA-1371.
 */
import type { RichTextNode } from "#contracts/types/rich-text-node.type";
import { richTextPlainOf } from "#core/functions/rich-text-plain-of.function";

/** The nodes and marks of tentap's TenTapStartKit schema. */
const NODES = new Set([
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "taskList",
  "taskItem",
  "blockquote",
  "hardBreak",
  "image",
]);
const MARKS = new Set([
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "link",
  "textStyle",
  "highlight",
]);
const TAGS =
  /^(p|h[1-6]|ul|ol|li|blockquote|br|strong|b|em|i|u|s|del|strike|code|a|span|mark|img|label|input|div)$/;
const TEXTBLOCKS = new Set(["paragraph", "heading"]);

/** A node rebuilt for the native schema; `lossy` collects whether anything was replaced. */
const clean = (node: RichTextNode, parent: string, lossy: { found: boolean }): RichTextNode[] => {
  if (!NODES.has(node.type)) {
    lossy.found = true;
    const text = richTextPlainOf(node).replaceAll("\n", " ");
    if (text === "") return [];
    const leaf = { type: "text", text };
    return [TEXTBLOCKS.has(parent) ? leaf : { type: "paragraph", content: [leaf] }];
  }
  const { dir: _dir, ...attrs } = node.attrs ?? {};
  const marks = node.marks?.filter((mark) => MARKS.has(mark.type) || !(lossy.found = true));
  const content = node.content?.flatMap((child) => clean(child, node.type, lossy));
  return [
    {
      type: node.type,
      ...(Object.keys(attrs).length > 0 ? { attrs } : {}),
      ...(content === undefined ? {} : { content }),
      ...(marks === undefined || marks.length === 0 ? {} : { marks }),
      ...(node.text === undefined ? {} : { text: node.text }),
    },
  ];
};

/**
 * The value in the native editor's form.
 * @param value - document JSON or HTML
 * @returns what the native editor loads, and whether that loses something the web editor wrote
 */
export function richTextNativeOf(value: RichTextNode | string | undefined): {
  readonly content: RichTextNode | string;
  readonly isLossy: boolean;
} {
  if (value === undefined) return { content: "", isLossy: false };
  if (typeof value === "string") {
    const tags = [...value.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9]*)/g)].map((match) =>
      (match[1] ?? "").toLowerCase(),
    );
    return { content: value, isLossy: tags.some((tag) => !TAGS.test(tag)) };
  }
  const lossy = { found: false };
  const [content = { type: "doc" }] = clean(value, "", lossy);
  return { content, isLossy: lossy.found };
}
