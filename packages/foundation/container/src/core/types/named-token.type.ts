/**
 * Stackra file contract:
 * Purpose: `NamedToken<P, N>`, the value `named(Port, "x")` returns: the wiring's way to ask for the instance of a
 *          port that config names `x`, where a constructor parameter is typed `Named<Port, "x">`.
 * Boundary: a type only. One value exists per port and name (`named` interns it), so it works as a map key.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 17: a named instance is the type `Named<Port, "x">`); ADR 0263 (decision 4).
 */
import type { Port } from "@stackra/contracts";

import type { AnyClass } from "#core/types/any-class.type";

/** The token of one named instance of a port. */
export interface NamedToken<P extends Port = Port, N extends string = string> {
  /** The port the instance implements. */
  readonly port: AnyClass<P>;

  /** The instance name config declares, such as `"primary"`. */
  readonly name: N;
}
