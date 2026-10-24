/**
 * Stackra file contract:
 * Purpose: `WiringBinding`, one binding in a generated wiring: the class, its owning module, its kind, its lifetime
 *          and the tokens of its constructor parameters, read by gen from the declared parameter types.
 * Boundary: a type only; the container builds the class with these dependencies and never reads `design:paramtypes`.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (decisions 5, 7 and 11); ADR 0294 (decision 17); ADR 0227 2026-10-24 note.
 */
import type { Lifetime } from "#core/decorators/lifetime.decorator";
import type { AnyClass } from "#core/types/any-class.type";
import type { Token } from "#core/types/token.type";

/** One class the container builds. */
export interface WiringBinding {
  /** The key of the module that owns the class. */
  readonly module: string;

  /** The class's kind code (`service`, `action`, `explorer`, ...), as its base class registered it. */
  readonly kind?: string;

  /** The class, which is also its token. */
  readonly provide: AnyClass;

  /** How long an instance lives; a singleton when absent. */
  readonly lifetime?: Lifetime;

  /** The tokens of the constructor parameters, in order. */
  readonly deps?: readonly Token[];
}
