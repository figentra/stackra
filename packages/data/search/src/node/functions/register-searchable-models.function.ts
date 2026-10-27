/**
 * Stackra file contract:
 * Purpose: `registerSearchableModels`, the call gen's wiring makes for the `@Searchable` models of a service: each
 *          model's committed row changes then reach `SearchableChangeService` through the outbox, which keeps its
 *          documents current with no `index` call in the writer; a `semantic: true` model's changes also reach
 *          `SemanticChangeService`, which embeds its passage.
 * Boundary: writes the internal `SEARCHABLE_MODELS` and the outbox's change-consumer registry after checking every
 *           model, so a refused batch registers none; registering a model again changes nothing. Models are told apart
 *           by class name, the name a stored change carries.
 * Runtime: node
 * Governing contract: ADR 0221 (decision 5: indexing through the outbox); ADR 0294 (decision 6: `@Searchable` is a
 *                     class facet); ADR 0380; STA-1326 (semantic indexing).
 */
import type { AnyClass } from "@stackra/container";
import { Searchable } from "@stackra/model";
import { registerChangeConsumers } from "@stackra/outbox";

import { SEARCHABLE_MODELS } from "#node/constants/searchable-models.constant";
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
  for (const [name, model] of next) SEARCHABLE_MODELS.set(name, model);
  registerChangeConsumers(
    models.flatMap((model) => [
      [model, SearchableChangeService] as const,
      ...(Searchable.on(model)?.semantic === true ? [[model, SemanticChangeService] as const] : []),
    ]),
  );
}
