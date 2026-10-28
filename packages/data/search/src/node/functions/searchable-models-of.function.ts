/**
 * Stackra file contract:
 * Purpose: `searchableModelsOf(name?)`, the registered `@Searchable` models a reindex runs over: the one named, or
 *          every registered model when no name is given, in registration order.
 * Boundary: reads `SEARCHABLE_MODELS`, which `registerSearchableModels` fills at boot; a name is a model's class name,
 *           the one a row change and the registry carry.
 * Runtime: node
 * Governing contract: ADR 0404 (decision 3); ADR 0221 (decision 5).
 */
import type { AnyClass } from "@stackra/container";

import { SearchModelUnknownError } from "#core/errors/search-model-unknown.error";
import { SEARCHABLE_MODELS } from "#node/constants/searchable-models.constant";

/**
 * The models to reindex.
 *
 * @throws SearchModelUnknownError when `name` names no registered model.
 * @example
 * searchableModelsOf("Product"); // [Product]
 */
export function searchableModelsOf(name?: string): readonly AnyClass[] {
  if (name === undefined) return [...SEARCHABLE_MODELS.values()];
  const model = SEARCHABLE_MODELS.get(name);
  if (model === undefined) throw SearchModelUnknownError.create({ model: name });
  return [model];
}
