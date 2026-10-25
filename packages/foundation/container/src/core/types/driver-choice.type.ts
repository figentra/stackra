/**
 * Stackra file contract:
 * Purpose: `DriverChoice`, a driver selection that wins over config: a fallback name every port with such a
 *          candidate takes (`"memory"`), and names per port, matched on the port key, its member or the port class
 *          name. The testing module builds it from `.useDrivers(...)`.
 * Boundary: a type only; an override of the port still wins over it.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (decisions 9 and 12); ADR 0266 (memory first).
 */

/** Driver names chosen ahead of config. */
export interface DriverChoice {
  /** The driver every port with a candidate of this name takes, such as `"memory"`. */
  readonly fallback?: string;

  /** Port key, member key or port class name to the driver name that port must take. */
  readonly byPort?: Readonly<Record<string, string>>;
}
