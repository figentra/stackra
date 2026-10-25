/**
 * Stackra file contract:
 * Purpose: `UnresolvedPortError`, what the container throws when it boots without a driver for a port it needs: no
 *          candidate, no selection among several, no named instance, no override and no replacement.
 * Boundary: a plain `Error`, not a refusal: a missing binding is a bug in the host or the test, never an answer to a
 *           caller, and `@stackra/errors` depends on this package, not the reverse (owner decision 2026-10-24, Q1).
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (consequences: a wiring mistake fails at boot); ADR 0127 2026-10-24 note.
 */
import type { Port } from "@stackra/contracts";

import type { AnyClass } from "#core/types/any-class.type";

/** A port the container needs has no driver. */
export class UnresolvedPortError extends Error {
  /** The port without a driver. */
  readonly port: AnyClass<Port>;

  /**
   * @param port - the port without a driver.
   * @param reason - why none was bound, completing "No driver is bound to <Port>: …".
   */
  constructor(port: AnyClass<Port>, reason: string) {
    super(`No driver is bound to ${port.name}: ${reason}`);
    this.name = "UnresolvedPortError";
    this.port = port;
  }
}
