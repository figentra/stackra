/**
 * Stackra file contract:
 * Purpose: `@Classified(DataClassification.X)`, the privacy serializer of a field: it records the class of personal
 *          data the field holds, which export, erasure and the access log read.
 * Boundary: made with `createDecorator` and exported as it is, so `Classified.members(Model)` gives the
 *           classification of each field to the code that reads it. It records only; it fits a field of any type and
 *           may mark the shape kinds only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (amendment item 3: `@Classified` is a field decorator); ADR 0134 (classification).
 */
import type { DataClassification } from "@stackra/contracts";
import { createDecorator, DecoratorTarget } from "@stackra/container";

import { SHAPE_KINDS } from "#core/constants/shape-kinds.constant";

/**
 * Records the class of personal data a field holds.
 *
 * @example
 * ```ts
 * @Classified(DataClassification.Pseudonymous)
 * @Str({ max: 64 })
 * memberId!: string;
 *
 * Classified.members(LoyaltyAccount).get("memberId"); // "pseudonymous"
 * ```
 */
export const Classified = createDecorator<DataClassification>({
  kind: "classified",
  target: DecoratorTarget.Field,
  kinds: SHAPE_KINDS,
});
