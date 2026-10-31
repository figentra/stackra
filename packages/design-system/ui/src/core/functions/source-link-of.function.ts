/**
 * Stackra file contract:
 * Purpose: `sourceLinkOf`, what a `SourceChip` shows and follows: the safe link (`http:` or `https:` only), the title
 *          (the given one or the link's domain) and the letter drawn when there is no favicon.
 * Boundary: pure; an `href` that is not a web address (a `javascript:` URL from a model's output) is dropped, so the
 *           chip is a document and never a link.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); OWASP XSS prevention (URL schemes); STA-1371.
 */
import type { SourceItem } from "#contracts/types/source-item.type";

/** The safe link, the title and the fallback letter of a source. */
export function sourceLinkOf(source: SourceItem): {
  readonly href: string | undefined;
  readonly title: string;
  readonly letter: string;
} {
  let href: string | undefined;
  let host = "";
  try {
    const url = new URL(source.href ?? "");
    if (url.protocol === "http:" || url.protocol === "https:") {
      href = url.href;
      host = url.hostname.replace(/^www\./, "");
    }
  } catch {
    href = undefined;
  }
  const title = source.title ?? (host || source.key);
  return { href, title, letter: (title.trim()[0] ?? "?").toLocaleUpperCase() };
}
