/**
 * Stackra file contract:
 * Purpose: `driverName`, the name a driver registers under for its port: its file stem without the port's kebab name
 *          (`postgres-loyalty-ledger.driver.ts` for `LoyaltyLedger` is `postgres`), which `DriverName<Port>`, the
 *          `selectedBy` config field and runway values name.
 * Boundary: pure. A stem that does not end in the port's name is the name as a whole.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: the driver registry); ADR 0263 (drivers by file prefix).
 */
import { kebabCase } from "#core/functions/kebab-case.function";

/**
 * The driver name of a driver file.
 *
 * @param file - the driver's source file (any path form).
 * @param port - the port's class name.
 * @example
 * driverName("src/node/drivers/postgres-loyalty-ledger.driver.ts", "LoyaltyLedger"); // "postgres"
 */
export function driverName(file: string, port: string): string {
  const stem = (file.split("/").pop() ?? file).replace(/\.driver\.tsx?$/, "");
  const suffix = `-${kebabCase(port)}`;
  return stem.endsWith(suffix) && stem.length > suffix.length
    ? stem.slice(0, -suffix.length)
    : stem;
}
