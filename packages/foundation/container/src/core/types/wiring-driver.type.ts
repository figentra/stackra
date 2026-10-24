/**
 * Stackra file contract:
 * Purpose: `WiringDriver`, the driver table of one port in a generated wiring: the candidates by name (lazy imports,
 *          so a node driver never reaches a browser bundle), the config field that selects one, and the config field
 *          that declares named instances.
 * Boundary: a type only. A port with one candidate needs no selector; a port with none is bound by the host, an
 *           override or `@Replaces`, or the container fails with `UnresolvedPortError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (decision 9); ADR 0266 (one option, one driver, memory first); ADR 0294 (decision 19).
 */
import type { Port } from "@stackra/contracts";

import type { AnyClass } from "#core/types/any-class.type";
import type { Token } from "#core/types/token.type";

/** The drivers of one port. */
export interface WiringDriver {
  /** The port these drivers implement. */
  readonly port: AnyClass<Port>;

  /** The port key, `<member>.<PortClass>`, which `useDrivers({ member: name })` in a test matches on. */
  readonly key?: string;

  /** `config:<key>.<field>`: the config field whose value names the driver. */
  readonly selectedBy?: string;

  /** `config:<key>.<field>`: the config record of instance name to driver name, for `Named<Port, "x">`. */
  readonly named?: string;

  /** Driver name (the file prefix) to a lazy import of the driver class. */
  readonly candidates: Readonly<Record<string, () => Promise<AnyClass<Port>>>>;

  /** Driver name to the tokens of that driver's constructor parameters. */
  readonly deps?: Readonly<Record<string, readonly Token[]>>;
}
