/**
 * Stackra file contract:
 * Purpose: `FieldDecorator<T>`, a legacy field decorator that type-checks only on a field whose type fits `T` (or
 *          `T | null`, optional or not), so tsc refuses `@Int` on a string and `@List` on a field that is not an array
 *          (ADR 0294 R6).
 * Boundary: a type only; the runtime is the `createDecorator` function the decorator returns.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 6: each field decorator is typed against its field); ADR 0005 (legacy
 *                     decorators); the STA-335 type-to-schema spike.
 */

/**
 * A field decorator for fields of type `T`.
 *
 * @example
 * export function Secret(name: string): FieldDecorator<string> { ... }
 */
export type FieldDecorator<T> = <K extends string, O extends { [P in K]?: T | null }>(
  target: O,
  property: K,
) => void;
