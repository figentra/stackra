/**
 * Stackra file contract:
 * Purpose: `ValidateOnFlush`, the opt-in trait of a model whose every created or changed row is checked against the
 *          model's generated schema (`X$`) before the unit of work writes it, so a service write cannot store a value
 *          its action input would have refused.
 * Boundary: adds no field; it is a marker in the trait registry. @stackra/database's `ValidateOnFlushSubscriber` reads
 *           it and refuses the flush with `ModelInvalidError`; the schema comes from the validation registry gen fills
 *           (`registerSchemas`). Native statements (`updateWhere`, `increment`) are not checked: they write no entity.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: one schema per shape); ADR 0096 (decision 4: traits run as ORM
 *                     subscribers); data-layer gap mo21 (stackra-287).
 */
import { createTrait } from "#core/functions/create-trait.function";
import type { Trait } from "#core/types/trait.type";

/**
 * The validate-on-flush trait.
 *
 * @example
 * export class PriceRule extends Model.with(HasPublicId("prr"), ValidateOnFlush) {}
 */
export const ValidateOnFlush: Trait = createTrait(
  "validate_on_flush",
  (base) => class extends base {},
);
