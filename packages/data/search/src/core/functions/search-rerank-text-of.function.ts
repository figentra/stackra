/**
 * Stackra file contract:
 * Purpose: `searchRerankTextOf`, the text a `Reranker` judges for one loaded row: its own `@Searchable` text fields as
 *          written (not folded), in the facet's order, joined by a line break and cut to `MAX_RERANK_CHARACTERS`.
 * Boundary: pure over the row it is given. Only the row's own fields count (a dotted path walks a relation the read
 *           did not populate, so it is left out); a translated field gives its `locale` text. A rich-text value is left
 *           out too: the reranker reads plain strings.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 4: the reranker); ADR 0221 (decision 3).
 */
import { Translated } from "@stackra/model";
import type { SearchableOptions } from "@stackra/model";

/** The most characters of one candidate's text: a cross-encoder reads about 512 tokens, so more is wasted. */
const MAX_RERANK_CHARACTERS = 1500;

/**
 * The text of `row` for the reranker.
 *
 * @param locale - the locale a translated field is read in; the field's first stored text when absent.
 * @example
 * searchRerankTextOf(product, { text: ["title", "description"] }, "en"); // "Linen shirt\nA light summer shirt"
 */
export function searchRerankTextOf(
  row: object,
  facet: Pick<SearchableOptions, "text">,
  locale?: string,
): string {
  const fields = row as Readonly<Record<string, unknown>>;
  return facet.text
    .filter((path) => !path.includes("."))
    .map((path) => {
      const value = fields[path];
      if (value instanceof Translated) return value.in(locale ?? "");
      return typeof value === "string" ? value : "";
    })
    .filter((text) => text !== "")
    .join("\n")
    .slice(0, MAX_RERANK_CHARACTERS);
}
