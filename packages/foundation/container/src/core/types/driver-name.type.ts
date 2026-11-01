/**
 * Stackra file contract:
 * Purpose: `DriverName<P>`, the type of a config field that picks the driver of port `P` by name (the driver file's
 *          prefix), read from the `DriverRegistry` and `PortRegistry` gen writes.
 * Boundary: a type only. A port is keyed by `<member>.<PortClass>`, which TypeScript cannot read from a class type.
 *           A port with a hand-written type-only `~key` brand narrows to its own names; any other port narrows to the
 *           names under each `PortRegistry` key whose class instance is the same type (structural identity: two
 *           unbranded ports with identical members both match, a wider union and never a wrong narrowing); a port
 *           in neither takes the names of every registered port. A misspelt name is still an error in all three.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 26); ADR 0263 (decision 9); STA-1810.
 */
import type { Port } from "@stackra/contracts";

import type { DriverRegistry } from "#core/types/driver-registry.type";
import type { RegisteredDriverNames } from "#core/types/registered-driver-names.type";

/**
 * A driver name of port `P`.
 *
 * @example
 * export class LoyaltyKitOptions extends Schema {
 *   ledger: DriverName<LoyaltyLedger> = "postgres";
 * }
 */
export type DriverName<P extends Port> = P extends { readonly "~key": infer K }
  ? K extends keyof DriverRegistry
    ? DriverRegistry[K]
    : never
  : [RegisteredDriverNames<P>] extends [never]
    ? DriverRegistry[keyof DriverRegistry]
    : RegisteredDriverNames<P>;
