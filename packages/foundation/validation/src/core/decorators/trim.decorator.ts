/**
 * Stackra file contract:
 * Purpose: `@Trim`, the transform decorator that trims a string field's input before its rules run. Written bare: it
 *          takes no options.
 * Boundary: made with `createDecorator`, so it records `true` and installs no accessor; gen compiles it to `.trim()`
 *           ahead of the field's checks. Typed against its field, so tsc refuses it on a field that is not a string.
 *           It may mark the shape kinds only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 6: transforms are field decorators); ADR 0095 as amended.
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { AnyClass } from "@stackra/container";

import { SHAPE_KINDS } from "#core/constants/shape-kinds.constant";
import type { FieldDecorator } from "#core/types/field-decorator.type";

/** The recording decorator; `Trim` is it applied with `true`. */
const TRIM = createDecorator<true>({
  kind: "trim",
  target: DecoratorTarget.Field,
  kinds: SHAPE_KINDS,
});

/**
 * Trims a string field's input.
 *
 * @example
 * ```ts
 * @Trim
 * @Str({ min: 2, max: 120 })
 * name!: string;
 * ```
 */
export const Trim: FieldDecorator<string> & {
  /** The trimmed fields of a class and its ancestors. */
  readonly members: (type: AnyClass) => ReadonlyMap<string | symbol, true>;
} = Object.assign(TRIM(true) as unknown as FieldDecorator<string>, { members: TRIM.members });
