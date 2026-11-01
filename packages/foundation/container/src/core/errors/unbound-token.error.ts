/**
 * Stackra file contract:
 * Purpose: `UnboundTokenError`, what the container throws when it resolves a class that nothing binds: not in the
 *          wiring, not exported by a booted module and not overridden.
 * Boundary: a plain `Error`, not a refusal, as `UnresolvedPortError` is: a missing binding is a bug in the host or the
 *           test. Typed so a caller (the events testing plugin) can tell it from an error a constructor throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (consequences: a wiring mistake fails at boot); STA-1740.
 */
import type { AnyClass } from "#core/types/any-class.type";

/** A class the container was asked for has no binding. */
export class UnboundTokenError extends Error {
  /** The class nothing binds. */
  readonly token: AnyClass;

  /**
   * @param token - the class nothing binds.
   */
  constructor(token: AnyClass) {
    super(
      `Nothing binds ${token.name}: it is not in the wiring, not exported by a booted module and not overridden ` +
        "(in a test, run `stackra gen` first: its setup registers the member's wiring)",
    );
    this.name = "UnboundTokenError";
    this.token = token;
  }
}
