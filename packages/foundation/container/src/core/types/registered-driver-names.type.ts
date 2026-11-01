/**
 * Stackra file contract:
 * Purpose: `RegisteredDriverNames<P>`, the driver names under every `PortRegistry` key whose class instance is the
 *          same type as port `P`, or `never` when no key matches.
 * Boundary: a type only. Identity is structural (mutually assignable): two unbranded ports with identical members
 *           both match, which widens the union and never narrows wrongly.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); STA-1810.
 */
import type { Port } from "@stackra/contracts";

import type { DriverRegistry } from "#core/types/driver-registry.type";
import type { PortRegistry } from "#core/types/port-registry.type";

/** The names registered for the port class that `P` is an instance of. */
export type RegisteredDriverNames<P extends Port> = {
  [K in keyof PortRegistry & keyof DriverRegistry]: PortRegistry[K] extends abstract new (
    ...args: never[]
  ) => infer I
    ? [I] extends [P]
      ? [P] extends [I]
        ? DriverRegistry[K]
        : never
      : never
    : never;
}[keyof PortRegistry & keyof DriverRegistry];
