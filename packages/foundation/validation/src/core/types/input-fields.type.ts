/**
 * Stackra file contract:
 * Purpose: `InputFields<T>`, the data fields a caller passes for a shape class: `Fields<T>` with the fields gen lists in
 *          the shape's `~defaults` brand made optional, because the compiled schema fills them when it parses.
 * Boundary: a type only. A type cannot see a property initializer, so gen emits the brand (a module augmentation in the
 *           schemas file, from the initializers); a shape with no brand, or one not generated yet, keeps every field
 *           required. A nested shape (also in an array or a union) gets the same treatment. `handle` still receives the
 *           full class, where the defaults are already filled.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 26); AGENTS.md "an initializer is the default"; STA-1694.
 */
import type { Schema } from "#core/bases/schema.base";

/** The defaulted field names of `T`, or never when gen has not narrowed the brand. */
type DefaultedKeys<T> = T extends { readonly "~defaults"?: infer D }
  ? string extends D
    ? never
    : Extract<D, string>
  : never;

/** A field's value with every nested shape replaced by its input fields. */
// `D` counts nested arrays: `Json` holds `Json[]`, so without a bound it maps back into itself (TS2589, STA-2215).
type InputValue<V, D extends readonly unknown[] = []> = V extends Schema
  ? InputFields<V>
  : V extends readonly unknown[]
    ? D["length"] extends 4
      ? V
      : { [I in keyof V]: InputValue<V[I], [...D, unknown]> }
    : V;

/** One object type from an intersection, so the result reads and compares as a plain shape. */
type Flat<T> = { [K in keyof T]: T[K] };

/** The keys that are data: no methods and not the brand. */
type DataKey<T, K extends keyof T> = T[K] extends (...args: never[]) => unknown
  ? never
  : // `~defaults`, and a config's `~kind` and `~config` (STA-2215): type-only brands, never data.
    K extends `~${string}`
    ? never
    : K;

/**
 * The data fields of `T` as a caller passes them: defaulted fields optional.
 *
 * @example
 * // CancelOrderInput { orderId!: PublicId<"ord">; reason: string | null = null }
 * const input: InputFields<CancelOrderInput> = { orderId }; // `reason` may be left out
 */
export type InputFields<T> = Flat<
  {
    [K in keyof T as K extends DefaultedKeys<T> ? never : DataKey<T, K>]: InputValue<T[K]>;
  } & {
    [K in keyof T as K extends DefaultedKeys<T> ? DataKey<T, K> : never]?: InputValue<T[K]>;
  }
>;
