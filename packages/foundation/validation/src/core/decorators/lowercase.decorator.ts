/**
 * Stackra file contract:
 * Purpose: `@Lowercase`, the transform decorator that lowercases a string field's input before its rules run (an
 *          email, a handle, a code). Written bare: it takes no options.
 * Boundary: made with `createDecorator`, so it records `true` and installs no accessor; gen compiles it to
 *           `.toLowerCase()` after `@Trim` and ahead of the field's checks. Typed against its field, so tsc refuses it
 *           on a field that is not a string. It may mark the shape kinds only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 6 and R6: transforms are field decorators); ADR 0095 (decision 5).
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { AnyClass } from "@stackra/container";

import { SHAPE_KINDS } from "#core/constants/shape-kinds.constant";
import type { FieldDecorator } from "#core/types/field-decorator.type";

/** The recording decorator; `Lowercase` is it applied with `true`. */
const LOWERCASE = createDecorator<true>({
  kind: "lowercase",
  target: DecoratorTarget.Field,
  kinds: SHAPE_KINDS,
});

/**
 * Lowercases a string field's input.
 *
 * @example
 * ```ts
 * @Trim
 * @Lowercase
 * @Str({ max: 320 })
 * email!: string;
 * ```
 */
export const Lowercase: FieldDecorator<string> & {
  /** The lowercased fields of a class and its ancestors. */
  readonly members: (type: AnyClass) => ReadonlyMap<string | symbol, true>;
} = Object.assign(LOWERCASE(true) as unknown as FieldDecorator<string>, {
  members: LOWERCASE.members,
});
