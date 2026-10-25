/**
 * Stackra file contract:
 * Purpose: `remoteShape`, the base gen writes a producer's shape class over
 *          (`class OrderView extends remoteShape("orders.OrderView", OrderView$) {}`): the shape name and its schema as
 *          statics, typed by the schema's output, so the class names a type, is a ref's input or output, takes part in
 *          `PickType(...)` and is extended by a form.
 * Boundary: the class is registered as the `schema` kind with its remote name; `create` parses with the shape's own
 *           schema, so it also works on a subclass that adds no field. A form that adds fields gets its schema from
 *           gen's `#stackra/schemas`.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 2); ADR 0095 (shapes); owner decision R-04 (typed static `create`).
 */
import { registerKind } from "@stackra/container";
import type { ZodType } from "zod";

import { defineStatics } from "#core/functions/define-statics.function";
import type { RemoteShape } from "#core/types/remote-shape.type";

/** `<module>.<PascalName>`. */
const SHAPE_NAME = /^[a-z][a-z0-9_]*\.[A-Z][A-Za-z0-9]*$/;

/**
 * A consumed shape class.
 *
 * @throws RangeError when `name` is not `<module>.<PascalName>`.
 * @example
 * export class RequestedLine extends remoteShape("orders.RequestedLine", z.object({
 *   variantId: publicId("var"),
 *   quantity: z.number().int().min(1),
 * })) {}
 */
export function remoteShape<S extends ZodType>(name: string, schema: S): RemoteShape<S> {
  if (!SHAPE_NAME.test(name))
    throw new RangeError(`"${name}" is not a shape name: <module>.<PascalName>`);
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: a shape class is read by its statics and typed by its schema
  const Shape = class {};
  defineStatics(Shape, {
    shapeName: name,
    schema,
    nullable: () => schema.nullable(),
    create(this: new () => object, values: unknown): object {
      return Object.assign(new this(), schema.parse(values));
    },
  });
  registerKind(Shape, "schema", { remote: name });
  return Shape as unknown as RemoteShape<S>;
}
