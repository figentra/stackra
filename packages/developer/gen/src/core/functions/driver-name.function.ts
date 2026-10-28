/**
 * Stackra file contract:
 * Purpose: `driverName`, the name a driver registers under for its port: its file stem without the port's kebab name
 *          (`postgres-loyalty-ledger.driver.ts` for `LoyaltyLedger` is `postgres`), which `DriverName<Port>`, the
 *          `selectedBy` config field and runway values name.
 * Boundary: pure. A driver name is a machine code, so snake_case (`printer-kick-cash-drawer.driver.ts` for
 *           `CashDrawer` is `printer_kick`, as `PERIPHERAL_DRIVERS` names it). A port named `<X>Driver` also strips
 *           `-<x>`. A stem that does not end in the port's name is the name as a whole.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: the driver registry); ADR 0263 (drivers by file prefix).
 */
import { kebabCase } from "@stackra/support";

/**
 * The driver name of a driver file.
 *
 * @param file - the driver's source file (any path form).
 * @param port - the port's class name.
 * @example
 * driverName("src/node/drivers/postgres-loyalty-ledger.driver.ts", "LoyaltyLedger"); // "postgres"
 * driverName("src/node/drivers/postgres-queue.driver.ts", "QueueDriver"); // "postgres"
 */
export function driverName(file: string, port: string): string {
  const stem = (file.split("/").pop() ?? file).replace(/\.driver\.tsx?$/, "");
  // A port named `<X>Driver` (`QueueDriver`) names its drivers `<name>-<x>` (`postgres-queue`).
  for (const name of [port, port.replace(/Driver$/, "")]) {
    const suffix = `-${kebabCase(name)}`;
    if (name !== "" && stem.endsWith(suffix) && stem.length > suffix.length)
      return stem.slice(0, -suffix.length).replaceAll("-", "_");
  }
  return stem.replaceAll("-", "_");
}
