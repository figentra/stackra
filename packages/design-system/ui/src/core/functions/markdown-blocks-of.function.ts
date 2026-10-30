/**
 * Stackra file contract:
 * Purpose: `markdownBlocksOf`, a small, safe Markdown subset parsed into blocks: headings (#, ##, ###), paragraphs,
 *          bullet and numbered lists, quotes and fenced code. Inline marks are `markdownInlineOf`'s.
 * Boundary: pure. HTML is never recognised: a `<tag>` stays literal text.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one parse for web and native); STA-1371.
 */
import type { MarkdownBlock } from "#core/types/markdown-block.type";

/** The blocks of `source`. */
export function markdownBlocksOf(source: string): MarkdownBlock[] {
  const lines = source.replaceAll(/\r\n?/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? "";
    const fence = /^```\s*([\w+-]*)\s*$/.exec(line);
    if (fence) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index] ?? ""))
        code.push(lines[index++] ?? "");
      index += 1;
      blocks.push({ kind: "code", language: fence[1] ?? "", code: code.join("\n") });
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      blocks.push({
        kind: "heading",
        level: (heading[1]?.length ?? 1) as 1 | 2 | 3,
        text: heading[2]?.trim() ?? "",
      });
      index += 1;
      continue;
    }
    const item = /^\s*(?:([-*+])|(\d+)[.)])\s+(.*)$/.exec(line);
    if (item) {
      const isOrdered = item[2] !== undefined;
      const items: string[] = [];
      while (index < lines.length) {
        const next = /^\s*(?:([-*+])|(\d+)[.)])\s+(.*)$/.exec(lines[index] ?? "");
        if (!next || (next[2] !== undefined) !== isOrdered) break;
        items.push(next[3] ?? "");
        index += 1;
      }
      blocks.push({ kind: "list", isOrdered, items });
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index] ?? ""))
        quote.push((lines[index++] ?? "").replace(/^>\s?/, ""));
      blocks.push({ kind: "quote", text: quote.join(" ") });
      continue;
    }
    if (line.trim() === "") {
      index += 1;
      continue;
    }
    const paragraph: string[] = [];
    while (
      index < lines.length &&
      (lines[index] ?? "").trim() !== "" &&
      !/^(#{1,3}\s|```|>|\s*(?:[-*+]|\d+[.)])\s)/.test(lines[index] ?? "")
    )
      paragraph.push((lines[index++] ?? "").trim());
    blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
  }
  return blocks;
}
