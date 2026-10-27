/**
 * Stackra file contract:
 * Purpose: `@List(options)`, the constraint decorator of an array field: item-count bounds and uniqueness.
 * Boundary: made with `createDecorator`, so it records its options and installs no accessor; gen compiles it to
 *           `z.array()` checks. Typed against its field, so tsc refuses it on a field that is not an array. It may
 *           mark the shape kinds only.
 *           Written bare (`@List`) when it has no options (ADR 0294 R6 bans `@List()`): legacy decorators then call it
 *           with the prototype and the field name, and it records `{}`.
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
export function List(options?: ListOptions): FieldDecorator<readonly unknown[]>;
/** The bare form: `@List` on an array field, with no options. */
export function List<K extends string, O extends { [P in K]?: readonly unknown[] | null }>(
  target: O,
  property: K,
): void;
/** Implementation of both forms: records `options` on the field, or `{}` when written bare. */
export function List(options: ListOptions | object = {}, property?: string | symbol): unknown {
  // Bare `@List`: the first argument is the prototype and the second the field name.
  if (property !== undefined) return LIST({})(options, property);
  return LIST(options as ListOptions);
}

/** The options recorded on each field of a class and its ancestors. */
List.members = LIST.members;
