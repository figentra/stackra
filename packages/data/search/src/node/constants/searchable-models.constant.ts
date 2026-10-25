/**
 * Stackra file contract:
 * Purpose: `SEARCHABLE_MODELS`, the `@Searchable` models this process keeps indexed from their row changes, by class
 *          name, the name a stored `RowChange` carries.
 * Boundary: process-wide and internal: written by `registerSearchableModels`, read by `SearchableChangeService`. A
 *           model with no entry is indexed only by its writer's own `index` calls.
 * Runtime: node
 * Governing contract: ADR 0221 (decision 5: indexing through the outbox).
 */
import type { AnyClass } from "@stackra/container";

/** Model class name to the model class. */
export const SEARCHABLE_MODELS = new Map<string, AnyClass>();
