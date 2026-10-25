/**
 * Stackra file contract:
 * Purpose: `ResolvedDocument`, a template with every block resolved against one set of data: the format-free model
 *          that `renderHtml` and `renderDocx` both draw.
 * Boundary: a type only; holds the parsed template for its page, locales, layout and name.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2).
 */
import type { ParsedDocumentTemplate } from "#core/types/parsed-document-template.type";
import type { ResolvedBlock } from "#core/types/resolved-block.type";

/** A template filled with its data. */
export interface ResolvedDocument {
  /** The checked template. */
  readonly template: ParsedDocumentTemplate;

  /** Its blocks, resolved, in order. */
  readonly blocks: readonly ResolvedBlock[];
}
