/**
 * Stackra file contract:
 * Purpose: `DeprecatedTraitIR`, a model trait the member deprecates: `export const X = createTrait("code", apply, {
 *          deprecated: { since, sunset, replacement } })`, which gen records in the manifest and warns on when a model
 *          composes it with `Model.with`.
 * Boundary: a type only. A trait is a value, not a class, so it carries no `@Deprecated`; its `deprecated` option is
 *           read from source by the same rule (`deprecationProblem`).
 * Runtime: isomorphic
 * Governing contract: ADR 0131 (decision 4: a trait can be deprecated); ADR 0096 (traits); STA-2836.
 */
import type { Deprecation } from "@stackra/contracts";

/** One deprecated trait of the member. */
export interface DeprecatedTraitIR {
  /** The exported name, as `Model.with(...)` writes it (`SoftDeletes`). */
  readonly name: string;

  /** The trait's code, the first argument of `createTrait` (`soft_deletes`). */
  readonly code: string;

  /** The module key of the file that declares it. */
  readonly module: string;

  /** The source file, relative to the member root. */
  readonly file: string;

  /** The specifier generated files import it from. */
  readonly importPath: string;

  /** The 1-based line of the declaration. */
  readonly line: number;

  /** The 1-based column of the declaration. */
  readonly column: number;

  /** The terms the trait's `deprecated` option records: since, sunset and replacement. */
  readonly deprecated: Deprecation;
}
