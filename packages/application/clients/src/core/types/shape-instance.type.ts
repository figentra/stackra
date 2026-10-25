/**
 * Stackra file contract:
 * Purpose: `ShapeInstance<T>`, the instance type of a class built over a schema whose output is `T`: `T` itself when it
 *          is one object type, else `object`, because a class cannot extend a union or a primitive.
 * Boundary: a type only; used by `remoteShape` and `eventRef`.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 3).
 */

/** The intersection of every member of the union `U`. */
type Intersected<U> = (U extends unknown ? (value: U) => void : never) extends (
  value: infer I,
) => void
  ? I
  : never;

/** `T` when it is a single object type, else `object`. */
export type ShapeInstance<T> = [T] extends [object]
  ? [T] extends [Intersected<T>]
    ? T
    : object
  : object;
