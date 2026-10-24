/**
 * Stackra file contract:
 * Purpose: `DriverName<P>`, the type of a config field that picks the driver of port `P` by name (the driver file's
 *          prefix), read from the `DriverRegistry` gen writes.
 * Boundary: a type only. A port is keyed by `<member>.<PortClass>`, which TypeScript cannot read from a class type,
 *           so a port that carries a type-only `~key` brand (which gen may add by augmentation) narrows to its own
 *           names, and any other port takes the names of every registered port: a misspelt name is still an error.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9).
 */
import type { Port } from "@stackra/contracts";

import type { DriverRegistry } from "#core/types/driver-registry.type";

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
  : DriverRegistry[keyof DriverRegistry];
