/**
 * Stackra file contract:
 * Purpose: `@Num(options)`, the decorator of a field that holds any finite number (a rate, a ratio): bounds, an
 *          exclusive lower bound and the message key of a failure; with `each: true`, each value of a list or map.
 * Boundary: made with `createDecorator`, so it records its options and installs no accessor; gen compiles it to
 *           `z.number()`. Typed against its field, so tsc refuses it on a string. It may mark the shape kinds only.
 *           Written bare (`@Num`) when it has no options (ADR 0294 R6 bans `@Num()`): legacy decorators then call it
 *           with the prototype and the field name, and it records `{}`.
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
/** The bare form: `@Num` on a number field, with no options. */
export function Num<K extends string, O extends { [P in K]?: number | null }>(
  target: O,
  property: K,
): void;
/** Implementation of every form: records `options` on the field, or `{}` when written bare. */
export function Num(options: NumOptions | object = {}, property?: string | symbol): unknown {
  // Bare `@Num`: the first argument is the prototype and the second the field name.
  if (property !== undefined) return NUM({})(options, property);
  return NUM(options as NumOptions);
}

/** The options recorded on each field of a class and its ancestors. */
Num.members = NUM.members;
