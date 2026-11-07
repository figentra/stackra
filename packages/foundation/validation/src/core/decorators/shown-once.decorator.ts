/**
 * Stackra file contract:
 * Purpose: `@ShownOnce`, the serializer decorator of an output field the caller sees once and nobody keeps: a
 *          signing secret, a new API key, an OAuth client secret. Written bare: it takes no options.
 * Boundary: made with `createDecorator`, so it records `true` and installs no accessor. The field still goes out on
 *           the wire in the first response; the action pipeline drops it before the idempotency store keeps the
 *           output, and a replay answers without it and with `secretOmitted: true` (STA-2568). It may mark the shape
 *           kinds only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 6 and R6: serializers are field decorators); ADR 0136 (decision 3).
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { AnyClass } from "@stackra/container";

import { SHAPE_KINDS } from "#core/constants/shape-kinds.constant";
import type { FieldDecorator } from "#core/types/field-decorator.type";

/** The recording decorator; `ShownOnce` is it applied with `true`. */
const SHOWN_ONCE = createDecorator<true>({
  kind: "shown-once",
  target: DecoratorTarget.Field,
  kinds: SHAPE_KINDS,
});

/**
 * Keeps a field out of every stored copy of an output.
 *
 * @example
 * ```ts
 * @ShownOnce
 * signingSecret!: string;
 * ```
 */
export const ShownOnce: FieldDecorator<unknown> & {
  /** The shown-once fields of a class and its ancestors. */
  readonly members: (type: AnyClass) => ReadonlyMap<string | symbol, true>;
} = Object.assign(SHOWN_ONCE(true) as unknown as FieldDecorator<unknown>, {
  members: SHOWN_ONCE.members,
});
