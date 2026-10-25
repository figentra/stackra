/**
 * Stackra file contract:
 * Purpose: `Fields<T>`, the data fields of a shape class: its public instance properties without its methods. A
 *          generated `X$Check` compares it with the compiled schema's output, and `X.create` takes it.
 * Boundary: a type only. Optional and readonly modifiers are kept; protected brands (`~kind`) are not in `keyof`, so
 *           they drop out too. A nested shape (also in an array or a union) becomes its own `Fields`, so plain values
 *           and a schema's `z.output` match it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: `X$Check`); the STA-335 type-to-schema and kind-base spikes.
 */
import type { Schema } from "#core/bases/schema.base";

/** A field's value with every nested shape replaced by its data fields. */
type FieldValue<V> = V extends Schema
  ? Fields<V>
  : V extends readonly unknown[]
    ? { [I in keyof V]: FieldValue<V[I]> }
    : V;

/**
 * The data fields of `T`.
 *
 * @example
 * export type OrderView$Check = Assert<Same<z.output<typeof OrderView$>, Fields<OrderView>>>;
 */
export type Fields<T> = {
  [K in keyof T as T[K] extends (...args: never[]) => unknown ? never : K]: FieldValue<T[K]>;
};
