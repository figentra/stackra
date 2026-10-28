/**
 * Stackra file contract:
 * Purpose: `registerSearchableModels`, the call gen's wiring makes for the `@Searchable` models of a service: each
 *          model's committed row changes then reach `SearchableChangeService` through the outbox, which keeps its
 *          documents current with no `index` call in the writer; a `semantic: true` model's changes also reach
 *          `SemanticChangeService`, which embeds its passage; and each model a dotted facet path walks to
 *          (`variants.sku`) is watched by `RelatedChangeService`, which re-indexes the parents of a changed row.
 * Boundary: writes the internal `SEARCHABLE_MODELS` and the outbox's change-consumer registry after checking every
 *           model, so a refused batch registers none; registering a model again changes nothing. Models are told apart
 *           by class name, the name a stored change carries. The related models come from the facet and the relation
 *           decorators (`searchRelationsOf`), so gen's one `registerSearchableModels` call covers them.
 * Runtime: node
 * Governing contract: ADR 0221 (decision 5: indexing through the outbox); ADR 0294 (decision 6: `@Searchable` is a
 *                     class facet); ADR 0380; STA-1326 (semantic indexing); data-layer gap se4 (parent invalidation).
 */
import type { AnyClass } from "@stackra/container";
import { Searchable } from "@stackra/model";
import { registerChangeConsumers } from "@stackra/outbox";

import { SEARCH_RELATIONS } from "#node/constants/search-relations.constant";
import { SEARCHABLE_MODELS } from "#node/constants/searchable-models.constant";
import { searchRelationsOf } from "#node/functions/search-relations-of.function";
import { RelatedChangeService } from "#node/services/related-change.service";
import { SearchableChangeService } from "#node/services/searchable-change.service";
import { SemanticChangeService } from "#node/services/semantic-change.service";

/**
 * Keeps each model's search index current from its row changes.
 *
 * @throws TypeError when a model has no `@Searchable` facet, or another model class of the same name is registered.
 * @example
 * registerSearchableModels([Product, Article]);
 */
export function registerSearchableModels(models: readonly AnyClass[]): void {
  const next = new Map(SEARCHABLE_MODELS);
  for (const model of models) {
    if (Searchable.on(model) === undefined)
      throw new TypeError(`registerSearchableModels: ${model.name} is not @Searchable`);
    const held = next.get(model.name);
    if (held !== undefined && held !== model)
      throw new TypeError(
        `registerSearchableModels: two models are named ${model.name}; a stored change names its model by class name`,
      );
    next.set(model.name, model);
  }
  const relations = models.flatMap((model) => searchRelationsOf(model));
  for (const [name, model] of next) SEARCHABLE_MODELS.set(name, model);
  for (const relation of relations) {
    const held = SEARCH_RELATIONS.get(relation.child.name) ?? [];
    const same = (each: (typeof held)[number]): boolean =>
      each.parent === relation.parent && each.via.join(".") === relation.via.join(".");
    if (!held.some(same)) SEARCH_RELATIONS.set(relation.child.name, [...held, relation]);
  }
  registerChangeConsumers([
    ...models.flatMap((model) => [
      [model, SearchableChangeService] as const,
      ...(Searchable.on(model)?.semantic === true ? [[model, SemanticChangeService] as const] : []),
    ]),
    ...relations.map((relation) => [relation.child, RelatedChangeService] as const),
  ]);
}
