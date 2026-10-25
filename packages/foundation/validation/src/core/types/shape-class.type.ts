/**
 * Stackra file contract:
 * Purpose: `ShapeClass<T>`, the class type `PickType`, `OmitType`, `PartialType` and `Page.of` return: a shape class
 *          whose instances are `T` and a `Schema`, with `Schema.create` typed to the subclass that extends it.
 * Boundary: a type only, one abstract construct signature plus the statics of `Schema`, so `class X extends
 *           PickType(...)` resolves one base type, and a consumer's declaration emit can name it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 25: every factory returns an exported, named class type; amendment item 13).
 */
import type { Schema } from "#core/bases/schema.base";

/**
 * A shape class with instances `Schema & T`.
 *
 * @example
 * export class QuickOrderForm extends PickType(CreateOrderInput, ["lines"]) {}
 * // PickType returns ShapeClass<Pick<Fields<CreateOrderInput>, "lines">>
 */
export type ShapeClass<T extends object> = (abstract new () => Schema & T) &
  Pick<typeof Schema, "create">;
