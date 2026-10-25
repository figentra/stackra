/**
 * Stackra file contract:
 * Purpose: `EntityIR`, what the entity emitter needs about a model beyond its data fields: the `[OptionalProps]` keys a
 *          create may leave out (every trait field, and every field or relation with an initializer), its relations,
 *          and its public getters, which the `EntitySchema` lists as not persisted.
 * Boundary: a type only; present on a model's `ShapeIR` and nowhere else.
 * Runtime: isomorphic
 * Governing contract: ADR 0097 (decision 3: gen emits EntitySchema); ADR 0294 (decisions 4 and 26); the STA-335
 *                     entity-schema spike.
 */
import type { RelationIR } from "#core/types/relation-ir.type";

/** The entity facts of one model. */
export interface EntityIR {
  /** The `[OptionalProps]` keys, sorted: trait fields, and fields and relations that have an initializer. */
  readonly optional: readonly string[];

  /** The relation and link fields, in source order. */
  readonly relations: readonly RelationIR[];

  /** The public getters, in source order. */
  readonly computed: readonly string[];
}
