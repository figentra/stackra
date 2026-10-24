/**
 * Stackra file contract:
 * Purpose: `WiringReplacement`, one `@Replaces(Port)` gen found: a custom class bound in place of a port's driver or
 *          of another binding, across the whole container.
 * Boundary: a type only; the container builds `override` whenever `provide` is asked for.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 6 and 19: a custom driver class is bound with `@Replaces(Port)`).
 */
import type { AnyClass } from "#core/types/any-class.type";

/** One class bound in place of a token. */
export interface WiringReplacement {
  /** The token that is replaced. */
  readonly provide: AnyClass;

  /** The class built in its place. */
  readonly override: AnyClass;
}
