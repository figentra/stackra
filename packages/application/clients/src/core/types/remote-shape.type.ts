/**
 * Stackra file contract:
 * Purpose: `RemoteShape<S>`, the class `remoteShape` returns: a producer's shape (`OrderView`) as a class of this
 *          client, typed by the schema's output, so it names a type, takes part in `PickType(...)` and is extended by a
 *          form (`class CreateOrderForm extends RequestedLine`).
 * Boundary: a type only. The instance type has no `Schema` brand, so a plain decoded answer is an `OrderView`.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 2); ADR 0095 (shapes); owner decision R-04 (typed static `create`).
 */
import type { input, output, ZodNullable, ZodType } from "zod";

import type { ShapeInstance } from "#core/types/shape-instance.type";

/** A consumed shape class. */
export type RemoteShape<S extends ZodType = ZodType> = (abstract new () => ShapeInstance<
  output<S>
>) & {
  /** The producer's shape name (`orders.OrderView`). */
  readonly shapeName: string;

  /** The shape's schema. */
  readonly schema: S;

  /** The schema, or `null`. */
  nullable(): ZodNullable<S>;

  /**
   * An instance of the class from `values`, parsed by the schema.
   *
   * @throws ZodError when `values` do not match the schema.
   */
  create<T>(this: abstract new () => T, values: input<S>): T;
};
