/**
 * Stackra file contract:
 * Purpose: `WiringReplacement`, one `@Replaces(Port)` gen found: a custom class bound in place of a port's driver or
 *          of another binding, across the whole container.
 * Boundary: a type only; the container builds `override`, with `deps`, whenever `provide` is asked for.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 6 and 19: a custom driver class is bound with `@Replaces(Port)`).
 */
import type { AnyClass } from "#core/types/any-class.type";
import type { Container } from "#core/services/container.service";
import type { Token } from "#core/types/token.type";

/** One class bound in place of a token. */
export interface WiringReplacement {
  /** The token that is replaced. */
  readonly provide: AnyClass;

  /** The class built in its place. */
  readonly override: AnyClass;

  /**
   * The constructor tokens of `override`, which gen reads from its constructor as for any driver (STA-2569). Absent
   * from an older wiring: the override's own binding row is used, else it is built with none.
   */
  readonly deps?: readonly (Token | typeof Container)[];
}
