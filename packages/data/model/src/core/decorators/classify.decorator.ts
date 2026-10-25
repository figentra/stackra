/**
 * Stackra file contract:
 * Purpose: `@Classify(dataClass)`, the field decorator by which a model declares the data class of a field: a declared
 *          class (`PrivilegedDataClass`, a product's own) whose effects the AI context builder, support access, the
 *          search indexer and the export writer apply.
 * Boundary: made with `createDecorator`, so it records metadata only; one per field. It may mark the model kinds only.
 *           The personal-data classes (`personal`, `financial`, `health`, `pseudonymous`) stay `@Classified` of
 *           @stackra/validation, which also drives logs and erasure; a field may carry both.
 * Runtime: isomorphic
 * Governing contract: ADR 0341 (decisions 1 and 4); ADR 0134 (decision 2, amended by 0341); ADR 0294 (decision 6).
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { AnyClass, DecoratorFunction } from "@stackra/container";

import { MODEL_KINDS } from "#core/constants/model-kinds.constant";
import type { DataClassRef } from "#core/types/data-class-ref.type";

/** The recording decorator. */
const CLASSIFY = createDecorator<DataClassRef>({
  kind: "classify",
  target: DecoratorTarget.Field,
  kinds: MODEL_KINDS,
});

/**
 * Declares the field's data class.
 *
 * @example
 * ```ts
 * export class AdviceNote extends Model.with(HasPublicId("adv")) {
 *   @Classify(PrivilegedDataClass)
 *   body!: string;
 * }
 * ```
 */
export function Classify(dataClass: DataClassRef): DecoratorFunction {
  return CLASSIFY(dataClass);
}

/** The data class of each classified field of `type` and its ancestors. */
Classify.members = (type: AnyClass): ReadonlyMap<string | symbol, DataClassRef> =>
  CLASSIFY.members(type);
