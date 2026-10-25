/**
 * Stackra file contract:
 * Purpose: `@List(options)`, the constraint decorator of an array field: item-count bounds and uniqueness.
 * Boundary: made with `createDecorator`, so it records its options and installs no accessor; gen compiles it to
 *           `z.array()` checks. Typed against its field, so tsc refuses it on a field that is not an array. It may
 *           mark the shape kinds only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 6 and 26); ADR 0095 as amended.
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";

import { SHAPE_KINDS } from "#core/constants/shape-kinds.constant";
import type { FieldDecorator } from "#core/types/field-decorator.type";
import type { ListOptions } from "#core/types/list-options.type";

/** The recording decorator; `List` gives it its options. */
const LIST = createDecorator<ListOptions>({
  kind: "list",
  target: DecoratorTarget.Field,
  kinds: SHAPE_KINDS,
});

/**
 * Constrains an array field.
 *
 * @example
 * ```ts
 * @List({ min: 1, max: 100 })
 * lines!: RequestedLine[];
 * ```
 */
export function List(options: ListOptions = {}): FieldDecorator<readonly unknown[]> {
  return LIST(options) as unknown as FieldDecorator<readonly unknown[]>;
}

/** The options recorded on each field of a class and its ancestors. */
List.members = LIST.members;
