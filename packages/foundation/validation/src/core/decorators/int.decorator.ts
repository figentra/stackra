/**
 * Stackra file contract:
 * Purpose: `@Int(options)`, the decorator every whole-number field carries: bounds and the message key of a failure;
 *          with `each: true`, the rules of each value of a `number[]` or a map of numbers.
 * Boundary: made with `createDecorator`, so it records its options and installs no accessor; gen compiles it to
 *           `z.number().int()`. Typed against its field, so tsc refuses it on a string. It may mark the shape kinds
 *           only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 6 and 26); ADR 0095 as amended.
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";

import { SHAPE_KINDS } from "#core/constants/shape-kinds.constant";
import type { FieldDecorator } from "#core/types/field-decorator.type";
import type { IntOptions } from "#core/types/int-options.type";

/** The recording decorator; `Int` gives it its options. */
const INT = createDecorator<IntOptions>({
  kind: "int",
  target: DecoratorTarget.Field,
  kinds: SHAPE_KINDS,
});

/**
 * Marks a whole-number field, or each value of a number list or map with `each: true`.
 *
 * @example
 * ```ts
 * @Int({ min: 0 })
 * redeemPoints = 0;
 *
 * @Int({ min: 1, each: true })
 * quantities!: number[];
 * ```
 */
export function Int(
  options: IntOptions & { readonly each: true },
): FieldDecorator<readonly number[] | Readonly<Record<string, number>>>;
/** The single-value form: `@Int(options)` on a number field. */
export function Int(options?: IntOptions): FieldDecorator<number>;
/** Implementation of both forms: records `options` on the field. */
export function Int(options: IntOptions = {}): unknown {
  return INT(options);
}

/** The options recorded on each field of a class and its ancestors. */
Int.members = INT.members;
