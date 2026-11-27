/**
 * Stackra file contract:
 * Purpose: `headingAnchors(markdown)`, the id the docs site gives each heading of a page, by its 1-based line: the
 *          site's own `remarkHeading` (fumadocs-core, the plugin fumadocs-mdx runs on every page) over the page's
 *          headings in order, so a repeated heading gets the same `-1` suffix the site gives it.
 * Boundary: pure; reads Markdown text only. Headings inside fenced code blocks are not headings. A heading with inline
 *           Markdown (backticks, links, emphasis) or a custom `[#id]` throws, since its id would need the full Markdown
 *           parser; the error-code reference's headings are plain words.
 * Runtime: node
 * Governing contract: ADR 0514 (gen renders the Fumadocs site); STA-2891.
 */
import { remarkHeading } from "fumadocs-core/mdx-plugins/remark-heading";

/** A heading as the plugin reads it: an mdast heading with one text child. */
interface HeadingNode {
  readonly type: "heading";
  readonly depth: number;
  readonly children: { readonly type: "text"; readonly value: string }[];
  data?: { hProperties?: { id?: string } };
}

/**
 * The site id of every heading of `markdown`.
 *
 * @param markdown - the page's text.
 * @returns each heading's line, depth, text and id, in page order.
 * @throws Error when a heading holds inline Markdown or a custom id.
 * @example
 * headingAnchors("## Gen\n\n### Shapes and fields\n");
 * // [{ line: 1, depth: 2, text: "Gen", id: "gen" }, { line: 3, depth: 3, text: "Shapes and fields", id: "shapes-and-fields" }]
 */
export function headingAnchors(
  markdown: string,
): { line: number; depth: number; text: string; id: string }[] {
  const found: { line: number; node: HeadingNode }[] = [];
  let fenced = false;
  for (const [index, line] of markdown.split("\n").entries()) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    if (fenced) continue;
    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading === null) continue;
    const text = heading[2] ?? "";
    if (/[`*_[\]<>]/.test(text))
      throw new Error(`line ${index + 1}: heading "${text}" holds inline Markdown or a custom id`);
    found.push({
      line: index + 1,
      node: {
        type: "heading",
        depth: (heading[1] ?? "").length,
        children: [{ type: "text", value: text }],
      },
    });
  }
  const root = { type: "root", children: found.map(({ node }) => node) };
  (remarkHeading({ generateToc: false }) as (tree: unknown, file: unknown) => void)(root, {
    data: {},
  });
  return found.map(({ line, node }) => ({
    line,
    depth: node.depth,
    text: node.children[0]?.value ?? "",
    id: node.data?.hProperties?.id ?? "",
  }));
}
