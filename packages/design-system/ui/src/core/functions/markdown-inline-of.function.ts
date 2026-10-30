/**
 * Stackra file contract:
 * Purpose: `markdownInlineOf`, a Markdown line's inline runs: plain text, **bold**, *italic*, `code` and
 *          [links](url). A link keeps only an http(s), mailto or relative address; any other (javascript:, data:)
 *          becomes plain text.
 * Boundary: pure; no nesting of marks.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one parse for web and native); STA-1371.
 */
import type { MarkdownInline } from "#core/types/markdown-inline.type";

/** Whether `href` is safe to follow. */
function isSafeHref(href: string): boolean {
  return /^(https?:|mailto:|\/|#|\.)/i.test(href.trim());
}

/** The inline runs of `text`. */
export function markdownInlineOf(text: string): MarkdownInline[] {
  const pattern = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|\*([^*]+)\*|_([^_]+)_/g;
  const runs: MarkdownInline[] = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const at = match.index ?? 0;
    if (at > last) runs.push({ kind: "text", text: text.slice(last, at) });
    if (match[1] !== undefined) runs.push({ kind: "strong", text: match[1] });
    else if (match[2] !== undefined) runs.push({ kind: "code", text: match[2] });
    else if (match[3] !== undefined && match[4] !== undefined)
      runs.push(
        isSafeHref(match[4])
          ? { kind: "link", text: match[3], href: match[4] }
          : { kind: "text", text: match[3] },
      );
    else runs.push({ kind: "emphasis", text: match[5] ?? match[6] ?? "" });
    last = at + match[0].length;
  }
  if (last < text.length) runs.push({ kind: "text", text: text.slice(last) });
  return runs;
}
