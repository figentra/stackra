/**
 * Stackra file contract:
 * Purpose: `Commentable`, the trait of a model whose records take comments: the collaboration service keeps the
 *          threads, and the record activity tab shows them beside audit and domain events.
 * Boundary: adds no field; it is a marker in the trait registry. The comments live in the collaboration service's own
 *           tables, linked to the record by its public id, so the model's table does not change. The behaviour is
 *           @stackra/collaboration's (ADR 0321 owner column); the marker is declared here so a model in any package
 *           can carry it without importing collaboration.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 3: CO1); ADR 0321 (decision 2); ADR 0096 (decision 2: `*able`).
 */
import { createTrait } from "#core/functions/create-trait.function";
import type { Trait } from "#core/types/trait.type";

/**
 * The commentable trait.
 *
 * @example
 * export class Matter extends Model.with(HasPublicId("mat"), Commentable) {}
 */
export const Commentable: Trait = createTrait("commentable", (base) => class extends base {});
