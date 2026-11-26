/**
 * Stackra file contract:
 * Purpose: `MovesWithScope`, the trait of a model whose rows follow their scope node when it moves: its `scope_path`
 *          rows are re-pathed when the node and its subtree move under another parent (`scope.node.moved.v1`).
 * Boundary: adds no field; it is a marker in the trait registry, so a model opts in on purpose. The model keeps its own
 *           `scopePath` column (`t.scopePath()`). @stackra/database's `repathAllRecords` reads it with `traitsOf` and
 *           re-paths the model's rows; @stackra/scope's listener runs it on every move, so no service writes its own.
 * Runtime: isomorphic
 * Governing contract: ADR 0411 (subtree move); ADR 0096 (decision 4); ADR 0327 (decision 3).
 */
import { createTrait } from "#core/functions/create-trait.function";
import type { Trait } from "#core/types/trait.type";

/**
 * The moves-with-scope trait.
 *
 * @example
 * export class Ticket extends Model.with(HasPublicId("tkt"), MovesWithScope) {
 *   scopePath!: string;
 * }
 */
export const MovesWithScope: Trait = createTrait(
  "moves_with_scope",
  (base) => class extends base {},
);
