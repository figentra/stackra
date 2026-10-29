/**
 * Stackra file contract:
 * Purpose: `renderMarkdown`: a package README as HTML: headings, paragraphs, lists, tables, fenced code, quotes, rules,
 *          and inline code, bold, italics and links.
 * Boundary: pure. Every byte of input is escaped; raw HTML in the README (file-contract comments included) is dropped
 *           or shown as text; links keep only `https:`, `http:`, `mailto:` and `#` targets; images become links, so a
 *           page makes no request for them. shortcut: a small CommonMark subset (no nested lists, no reference links);
 *           move to a parser behind a catalog dependency if READMEs need more.
 * Runtime: worker
 * Governing contract: ADR 0453; STA-1608 spec FR-003.
 */
import { escapeHtml } from "#src/browse/escape-html";

/** A link target kept as is, or null when it is dropped. */
const safeHref = (href: string): string | null =>
  /^(https?:|mailto:|#)/i.test(href.trim()) ? href.trim() : null;

/** A heading's anchor id. */
const slug = (text: string): string =>
  text
    .toLowerCase()
    .replaceAll(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replaceAll(/\s+/g, "-");

/** Inline markup of one escaped-on-output run of text. */
function inline(text: string): string {
  const parts = text.split(/(`[^`]+`)/);
  return parts
    .map((part) => {
      if (part.length > 1 && part.startsWith("`") && part.endsWith("`"))
        return `<code>${escapeHtml(part.slice(1, -1))}</code>`;
      let html = escapeHtml(part);
      html = html.replaceAll(
        /!?\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g,
        (_, label, href) => {
          const target = safeHref(href.replaceAll("&amp;", "&"));
          return target === null ? label : `<a href="${escapeHtml(target)}">${label}</a>`;
        },
      );
      html = html.replaceAll(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      html = html.replaceAll(/(^|[\s(])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
      html = html.replaceAll(/(^|[\s(])_([^_\s][^_]*)_(?=$|[\s.,;:)])/g, "$1<em>$2</em>");
      return html;
    })
    .join("");
}

/** The cells of one table row. */
const cells = (line: string): string[] =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replaceAll("\\|", "|"));

const isTableRule = (line: string): boolean =>
  /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line);

const LIST_ITEM = /^\s*([-*+]|\d+[.)])\s+(.*)$/;

/**
 * A package README as HTML.
 *
 * @example
 * renderMarkdown("# Title\n\nSome `code`."); // '<h1 id="title">Title</h1>\n<p>Some <code>code</code>.</p>'
 */
export function renderMarkdown(markdown: string): string {
  const lines = markdown
    .replaceAll(/<!--[\s\S]*?-->/g, "")
    .replaceAll("\r\n", "\n")
    .split("\n");
  const out: string[] = [];
  let at = 0;
  const paragraph: string[] = [];
  const flush = (): void => {
    if (paragraph.length > 0) out.push(`<p>${inline(paragraph.join(" "))}</p>`);
    paragraph.length = 0;
  };
  while (at < lines.length) {
    const line = lines[at] ?? "";
    const fence = /^\s*(```|~~~)\s*([\w+-]*)/.exec(line);
    if (fence !== null) {
      flush();
      const code: string[] = [];
      at += 1;
      while (at < lines.length && !(lines[at] ?? "").trim().startsWith(fence[1] ?? "```")) {
        code.push(lines[at] ?? "");
        at += 1;
      }
      at += 1;
      const language = fence[2] === "" ? "" : ` data-language="${escapeHtml(fence[2] ?? "")}"`;
      out.push(`<pre${language}><code>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }
    const heading = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (heading !== null) {
      flush();
      const level = heading[1]?.length ?? 1;
      const text = heading[2] ?? "";
      out.push(`<h${level} id="${escapeHtml(slug(text))}">${inline(text)}</h${level}>`);
      at += 1;
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      flush();
      out.push("<hr>");
      at += 1;
      continue;
    }
    if (line.includes("|") && isTableRule(lines[at + 1] ?? "")) {
      flush();
      const head = cells(line);
      const rows: string[] = [];
      at += 2;
      while (at < lines.length && (lines[at] ?? "").includes("|")) {
        rows.push(
          `<tr>${cells(lines[at] ?? "")
            .map((cell) => `<td>${inline(cell)}</td>`)
            .join("")}</tr>`,
        );
        at += 1;
      }
      out.push(
        `<table><thead><tr>${head.map((cell) => `<th>${inline(cell)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`,
      );
      continue;
    }
    const item = LIST_ITEM.exec(line);
    if (item !== null) {
      flush();
      const ordered = /\d/.test(item[1] ?? "");
      const items: string[] = [];
      while (at < lines.length) {
        const current = LIST_ITEM.exec(lines[at] ?? "");
        if (current !== null) items.push(current[2] ?? "");
        else if (/^\s{2,}\S/.test(lines[at] ?? "") && items.length > 0)
          items.push(`${items.pop() ?? ""} ${(lines[at] ?? "").trim()}`);
        else break;
        at += 1;
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>${items.map((text) => `<li>${inline(text)}</li>`).join("")}</${tag}>`);
      continue;
    }
    if (/^\s*>/.test(line)) {
      flush();
      const quote: string[] = [];
      while (at < lines.length && /^\s*>/.test(lines[at] ?? "")) {
        quote.push((lines[at] ?? "").replace(/^\s*>\s?/, ""));
        at += 1;
      }
      out.push(`<blockquote>${renderMarkdown(quote.join("\n"))}</blockquote>`);
      continue;
    }
    if (line.trim() === "") flush();
    else paragraph.push(line.trim());
    at += 1;
  }
  flush();
  return out.join("\n");
}
