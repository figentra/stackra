/**
 * Stackra file contract:
 * Purpose: `@Num(options)`, the decorator of a field that holds any finite number (a rate, a ratio): bounds, an
 *          exclusive lower bound and the message key of a failure; with `each: true`, each value of a list or map.
 * Boundary: made with `createDecorator`, so it records its options and installs no accessor; gen compiles it to
 *           `z.number()`. Typed against its field, so tsc refuses it on a string. It may mark the shape kinds only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 6 and 26); ADR 0095 as amended.
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";

import { SHAPE_KINDS } from "#core/constants/shape-kinds.constant";
import type { FieldDecorator } from "#core/types/field-decorator.type";
import type { NumOptions } from "#core/types/num-options.type";

/** The recording decorator; `Num` gives it its options. */
const NUM = createDecorator<NumOptions>({
  kind: "num",
  target: DecoratorTarget.Field,
  kinds: SHAPE_KINDS,
});

/**
 * Marks a finite-number field, or each value of a number list or map with `each: true`.
 *
 * @example
 * ```ts
 * @Num({ exclusiveMin: 0 })
 * earnPerMinor = 0.01;
 * ```
 */
export function Num(
  options: NumOptions & { readonly each: true },
): FieldDecorator<readonly number[] | Readonly<Record<string, number>>>;
/** The single-value form: `@Num(options)` on a number field. */
export function Num(options?: NumOptions): FieldDecorator<number>;
/** Implementation of both forms: records `options` on the field. */
export function Num(options: NumOptions = {}): unknown {
  return NUM(options);
}

/** The options recorded on each field of a class and its ancestors. */
Num.members = NUM.members;
