/**
 * Stackra file contract:
 * Purpose: `SourceItem`, one citation of an AI answer: a web page (with `href`) or a document.
 * Boundary: a type only; only `http:` and `https:` links are followed, any other `href` is shown as a document.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */

/** One source an answer cites. */
export interface SourceItem {
  /** Unique within the list. */
  readonly key: string;
  /** The page's or document's name; defaults to the link's domain. */
  readonly title?: string | undefined;
  /** The page's address; left out, the source is a document. */
  readonly href?: string | undefined;
  /** A line about the source, shown in its preview (web) and read as its hint. */
  readonly description?: string | undefined;
  /** The site's icon; left out, the title's first letter (or a document mark) is drawn. */
  readonly faviconSrc?: string | undefined;
}
