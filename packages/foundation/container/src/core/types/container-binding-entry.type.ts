/**
 * Stackra file contract:
 * Purpose: `ContainerBindingEntry`, one row of `Container.bindings()`: a token the container can build, the scope it
 *          belongs to, its lifetime and the class that is built for it, all as names.
 * Boundary: a type only. Names, never classes or instances, so a tool (the devtools tab, a CLI) can show and serialise
 *           the table without reaching into the container.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (lifetimes); ADR 0246 (decision 2: the panel shows the container graph).
 */
import type { Lifetime } from "#core/decorators/lifetime.decorator";

/** One binding as tooling lists it. */
export interface ContainerBindingEntry {
  /** The token's name: the class name, or `named(Port, "x")`. */
  readonly token: string;

  /** The module key that binds it; for a port, its driver config key (`points.ledger`), else the port name. */
  readonly scope: string;

  /** How long an instance lives. */
  readonly lifetime: Lifetime;

  /** The name of the class built for the token: the driver, the replacement, the config override or itself. */
  readonly implementation: string;
}
