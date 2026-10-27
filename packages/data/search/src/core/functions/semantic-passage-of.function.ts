/**
 * Stackra file contract:
 * Purpose: `semanticPassageOf`, the text a `semantic: true` model's row is embedded from: its search document's text
 *          fields, one line per field (every locale of a translated field), after the runtime `ai: never` guard.
 * Boundary: pure over the row it is given. The guard walks each text path through the row's populated relations and
 *           refuses when the field it ends at, on any owner reached, carries a data class whose `ai` is `never`
 *           (`Classify.members`), so a field of a package model gen could not see is refused here too. It never
 *           calls an `Embedder`; `SemanticChangeService` does. The text is the document's normalised words, the same
 *           fold the lexical index stores.
 * Runtime: isomorphic
 * Governing contract: ADR 0380 (decisions 2 and 3: `ai: never` and the code floor); ADR 0341 (decision 2); ADR 0221;
 *                     STA-1326.
 */
import { AiAudience, Classify, Collection } from "@stackra/model";
import type { SearchableOptions } from "@stackra/model";

import { searchDocumentOf } from "#core/functions/search-document-of.function";

/** `value` as the items it stands for: a collection or array spreads, a reference unwraps, nothing is none. */
function spread(value: unknown): readonly unknown[] {
  if (value === null || value === undefined) return [];
  if (value instanceof Collection) return value.getItems();
  if (Array.isArray(value)) return value;
  const unwrap = (value as { readonly unwrap?: unknown }).unwrap;
  return typeof unwrap === "function" ? [unwrap.call(value)] : [value];
}

/**
 * Refuses a text path that ends at an `ai: never` field on any owner the row reaches.
 *
 * @throws TypeError naming the model and path, with the gen code `searchable_semantic_ai_never`.
 */
function guard(row: object, path: string): void {
  const keys = path.split(".");
  const last = keys.pop() ?? "";
  let owners: readonly unknown[] = [row];
  for (const key of keys)
    owners = owners.flatMap((owner) =>
      typeof owner === "object" && owner !== null
        ? spread((owner as Readonly<Record<string, unknown>>)[key])
        : [],
    );
  for (const owner of owners) {
    if (typeof owner !== "object" || owner === null) continue;
    const ref = Classify.members(owner.constructor as never).get(last);
    if (ref?.dataClass.ai === AiAudience.Never)
      throw new TypeError(
        `searchable_semantic_ai_never: ${row.constructor.name}.${path} has a data class that says ai: never, so @Searchable({ semantic: true }) may not embed it`,
      );
  }
}

/**
 * The passage of `row` to embed; an empty string when it has no text.
 *
 * @param row - a loaded row whose relations on the facet's text paths are populated.
 * @param facet - the model's `@Searchable` options.
 * @throws TypeError when a text path ends at an `ai: never` field.
 * @example
 * semanticPassageOf(note, Searchable.on(CaseNote)); // "unpaid invoice dispute\nnizaa fatura"
 */
export function semanticPassageOf(row: object, facet: SearchableOptions): string {
  for (const path of facet.text) guard(row, path);
  return searchDocumentOf(row, "", { text: facet.text })
    .fields.flatMap((field) => (typeof field === "string" ? [field] : Object.values(field)))
    .filter((line) => line !== "")
    .join("\n");
}
