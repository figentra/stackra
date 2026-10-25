/**
 * Stackra file contract:
 * Purpose: `SearchableMacro`, the partner macro of `@Searchable`: `t.searchable({ text, filters, locales })` writes the
 *          columns the search drivers fill: a weighted `tsvector` (`search_vector`, or `search_vector_<locale>` per
 *          locale), the normalised words for the trigram search (`search_text`) and the filter values
 *          (`search_filters`, jsonb).
 * Boundary: a `Macro` (ADR 0159 as amended by ADR 0305), installed by name as `t.searchable`. Every column is nullable
 *           (a row has no document until it is indexed) and commented with the fields it holds, so it adds to an
 *           existing table as an expand step. It writes no index: the migration declares its GIN and trigram indexes,
 *           so `stackra db diff` never proposes dropping one. Calling it orders the migration after this package's
 *           migrations, whose text function the trigram index calls.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305 (macros, literal snapshots); ADR 0221 (decisions 1 and 3);
 *                     ADR 0160 (approved extensions).
 */
import "#node/types/searchable-blueprint.type";

import { Macro } from "@stackra/database";
import type { Blueprint, ColumnGroup } from "@stackra/database";

import type { SearchableColumns } from "#node/types/searchable-columns.type";

/** A field path: model keys joined by dots, camelCase or snake_case. */
const PATH = /^[a-z][A-Za-z0-9_]*(\.[a-z][A-Za-z0-9_]*)*$/;

/** A BCP 47 locale tag: a language, then optional subtags. */
const LOCALE = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

/**
 * The search columns.
 *
 * @example
 * schema.table("products", (t: Blueprint) => {
 *   t.searchable({
 *     text: ["title", "description", "variants.sku"],
 *     filters: ["status", "collections.slug"],
 *     locales: ["en", "ar"],
 *   });
 * });
 */
export class SearchableMacro extends Macro {
  /**
   * Writes the columns on `t`.
   *
   * @param t - the blueprint of the searchable model's table.
   * @param columns - the facet's text and filter fields as literals, and the locales of a translated model.
   * @returns the columns written.
   * @throws TypeError for no text field, a field that is not a path, or locales that are empty, repeated or not tags.
   */
  apply(t: Blueprint, columns: SearchableColumns): ColumnGroup {
    const { text, filters = [], locales } = columns;
    if (text.length === 0) throw new TypeError("t.searchable needs at least one text field");
    for (const path of [...text, ...filters])
      if (!PATH.test(path)) throw new TypeError(`t.searchable: "${path}" is not a field path`);
    if (
      locales !== undefined &&
      (locales.length === 0 ||
        !locales.every((locale) => LOCALE.test(locale)) ||
        new Set(locales.map((locale) => locale.toLowerCase())).size !== locales.length)
    )
      throw new TypeError(
        `t.searchable: locales are distinct BCP 47 tags, got ${JSON.stringify(locales)}`,
      );
    const fields = text.join(", ");
    const vectors = (locales ?? [undefined]).map((locale) =>
      t
        .tsvector(
          locale === undefined
            ? "search_vector"
            : `search_vector_${locale.toLowerCase().replaceAll("-", "_")}`,
        )
        .nullable()
        .comment(
          `Weighted full-text words of ${fields}${locale === undefined ? "" : ` in ${locale}`}; written by @stackra/search.`,
        ),
    );
    return t.group(
      ...vectors,
      t
        .string("search_text")
        .nullable()
        .comment(
          `Normalised words of ${fields} for the trigram search; written by @stackra/search.`,
        ),
      t
        .jsonb("search_filters")
        .nullable()
        .comment(
          `Values of the search filters (${filters.join(", ") || "none"}); written by @stackra/search.`,
        ),
    );
  }
}
