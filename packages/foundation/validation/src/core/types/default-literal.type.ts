/**
 * Stackra file contract:
 * Purpose: `DefaultLiteral<T>`, the value a generated default spells for a schema output `T`: `T` with every brand read
 *          as its base (a `Duration` as its ISO 8601 text), through objects, arrays and records, so the constant gen
 *          evaluated from an initializer type-checks against the field's schema.
 * Boundary: a type only. A brand exists at compile time only (`Branded`), so the base value gen evaluated with the real
 *           constructor (`Duration.seconds(2)` is `"PT2S"`) is the value the runtime holds. Nesting is bounded, as in
 *           `Fields`, so a `Json` default never maps into itself (TS2589).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: defaults are constants gen evaluates); STA-1605.
 */

/**
 * `T` with every brand replaced by its base.
 *
 * @example
 * type Timeouts = DefaultLiteral<{ statement: Duration }>; // { statement: `P${string}` }
 */
// `D` counts nesting: `Json` holds `Json[]` and `{ [key: string]: Json }`, so without a bound it maps without end.
export type DefaultLiteral<T, D extends readonly unknown[] = []> = D["length"] extends 6
  ? T
  : T extends { readonly "~brand": { readonly base: infer B } }
    ? B
    : T extends readonly (infer E)[]
      ? DefaultLiteral<E, [...D, unknown]>[]
      : T extends (...args: never[]) => unknown
        ? T
        : T extends object
          ? { [K in keyof T]: DefaultLiteral<T[K], [...D, unknown]> }
          : T;
