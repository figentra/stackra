/**
 * Stackra file contract:
 * Purpose: `FieldDefault`, a constant default gen read from a field initializer: its JSON wire value for the manifest
 *          and its TypeScript expression for the generated schema.
 * Boundary: a type only. Only literals, enum cases, literal-typed constants and the closed set of platform
 *           constructors (`Duration.*`, `Money.of`, `Money.ofMinor`) become a default (ADR 0294 decision 26).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: defaults are constants).
 */

/** One field default. */
export interface FieldDefault {
  /** The wire value, as the manifest's JSON Schema records it. */
  readonly value: unknown;

  /** The expression the generated schema passes to `.default(...)`. */
  readonly code: string;

  /** Named imports the expression needs, as `[name, module specifier]`. */
  readonly imports: readonly (readonly [name: string, from: string])[];
}
