/**
 * Stackra file contract:
 * Purpose: `@Searchable(options)`, the class facet that declares a model's hybrid search index: the text fields, the
 *          filter fields and the `semantic` switch. `stackra db diff` writes its columns and the Postgres search driver keeps it in step
 *          with the unit of work.
 * Boundary: made with `createDecorator`, so it records metadata only; one per model. Paths are checked by gen. It may
 *           mark the model kinds only.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (Postgres hybrid search); ADR 0294 (decision 6); ADR 0380 (`semantic` and the
 *                     `ai: never` floor); STA-1326.
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
 * @throws TypeError when `options.text` is empty; at class definition, when applied to anything but a model class.
 * @example
 * ```ts
 * @Searchable({
 *   text: ["title", "description", "variants.sku"],
 *   filters: ["status", "collections.slug"],
 *   semantic: true,
 * })
 * export class Product extends Model.with(HasPublicId("prd")) {}
 * ```
 */
export function Searchable(options: SearchableOptions): DecoratorFunction {
  if (options.text.length === 0) throw new TypeError("@Searchable needs at least one text field");
  return SEARCHABLE(
    Object.freeze({
      text: Object.freeze([...options.text]),
      ...(options.filters === undefined ? {} : { filters: Object.freeze([...options.filters]) }),
      ...(options.semantic === undefined ? {} : { semantic: options.semantic }),
    }),
  );
}

/** The search index declared on a class or its nearest decorated ancestor; undefined when it has none. */
Searchable.on = SEARCHABLE.on;
