/**
 * Stackra file contract:
 * Purpose: `@Searchable(options)`, the class facet that declares a model's hybrid search index: the text fields, the
 *          filter, sortable and range fields, text weights (`boost`), the presence condition (`when`) and the
 *          `semantic` switch. `stackra db diff` writes its columns and the Postgres search driver keeps it in step
 *          with the unit of work.
 * Boundary: made with `createDecorator`, so it records metadata only; one per model. Paths are checked by gen. It may
 *           mark the model kinds only.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (Postgres hybrid search); ADR 0294 (decision 6); ADR 0380 (`semantic` and the
 *                     `ai: never` floor); STA-1326; data-layer gap se9 (stackra-302: facet field kinds).
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { DecoratorFunction } from "@stackra/container";

import { MODEL_KINDS } from "#core/constants/model-kinds.constant";
import type { SearchableOptions } from "#core/types/searchable-options.type";

/** The recording decorator; `Searchable` gives it its options. */
const SEARCHABLE = createDecorator<SearchableOptions>({
  kind: "searchable",
  target: DecoratorTarget.Class,
  kinds: MODEL_KINDS,
});

/**
 * Declares the search index of a model.
 *
 * @throws TypeError when `options.text` is empty, `boost` names a path that is not a text field, or a `when` field
 *         lists no value; at class definition, when applied to anything but a model class.
 * @example
 * ```ts
 * @Searchable({
 *   text: ["title", "description", "variants.sku"],
 *   filters: ["status", "collections.slug"],
 *   sortable: ["price", "publishedAt"],
 *   ranges: ["price"],
 *   boost: { "variants.sku": "A" },
 *   when: { status: ["active"] },
 *   semantic: true,
 * })
 * export class Product extends Model.with(HasPublicId("prd")) {}
 * ```
 */
export function Searchable(options: SearchableOptions): DecoratorFunction {
  if (options.text.length === 0) throw new TypeError("@Searchable needs at least one text field");
  for (const path of Object.keys(options.boost ?? {}))
    if (!options.text.includes(path))
      throw new TypeError(`@Searchable boost names ${path}, which is not one of its text fields`);
  for (const [path, values] of Object.entries(options.when ?? {}))
    if (values.length === 0)
      throw new TypeError(
        `@Searchable when lists no value for ${path}, so no row could be searchable`,
      );
  return SEARCHABLE(
    Object.freeze({
      text: Object.freeze([...options.text]),
      ...(options.filters === undefined ? {} : { filters: Object.freeze([...options.filters]) }),
      ...(options.sortable === undefined ? {} : { sortable: Object.freeze([...options.sortable]) }),
      ...(options.ranges === undefined ? {} : { ranges: Object.freeze([...options.ranges]) }),
      ...(options.boost === undefined ? {} : { boost: Object.freeze({ ...options.boost }) }),
      ...(options.when === undefined
        ? {}
        : {
            when: Object.freeze(
              Object.fromEntries(
                Object.entries(options.when).map(([path, values]) => [
                  path,
                  Object.freeze([...values]),
                ]),
              ),
            ),
          }),
      ...(options.semantic === undefined ? {} : { semantic: options.semantic }),
    }),
  );
}

/** The search index declared on a class or its nearest decorated ancestor; undefined when it has none. */
Searchable.on = SEARCHABLE.on;
