/**
 * Stackra file contract:
 * Purpose: `@Hidden`, the serializer decorator of a field that never goes out on the wire: a token hash, an internal
 *          note, a secret-like column. Written bare: it takes no options.
 * Boundary: made with `createDecorator`, so it records `true` and installs no accessor. Gen leaves the field out of
 *           the shape's `X$` schema (and out of `X$Check`), so no action output, OpenAPI document or tool schema
 *           carries it; the class keeps the field for server code. It may mark the shape kinds only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 6 and R6: serializers are field decorators); ADR 0095 (decision 6).
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { AnyClass } from "@stackra/container";

import { SHAPE_KINDS } from "#core/constants/shape-kinds.constant";
import type { FieldDecorator } from "#core/types/field-decorator.type";

/** The recording decorator; `Hidden` is it applied with `true`. */
const HIDDEN = createDecorator<true>({
  kind: "hidden",
  target: DecoratorTarget.Field,
  kinds: SHAPE_KINDS,
});

/**
 * Keeps a field off the wire.
 *
 * @example
 * ```ts
 * @Hidden
 * tokenHash!: string;
 * ```
 */
export const Hidden: FieldDecorator<unknown> & {
  /** The hidden fields of a class and its ancestors. */
  readonly members: (type: AnyClass) => ReadonlyMap<string | symbol, true>;
} = Object.assign(HIDDEN(true) as unknown as FieldDecorator<unknown>, { members: HIDDEN.members });
