/**
 * Stackra file contract:
 * Purpose: `PeripheralsConfig`, the point-of-sale peripherals configuration (key `peripherals`): the drivers gen's
 *          wiring selects by `config:peripherals.printer`, `.drawer` and `.scanner`, the printer's address, the drawer
 *          pin, the scanner's key gap and the boot probe.
 * Boundary: a configuration class over `PeripheralsOptions` with no env map; runway's `config.peripherals` layer sets
 *           it per environment. A host overrides it as `class PeripheralsConfig extends BasePeripheralsConfig` with
 *           `override` members only, inheriting the key. The `escpos` and `hid` drivers read it in main.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0253 (decision 4); ADR 0266
 *                     (decision 5).
 */
import { Config } from "@stackra/config";

import { PeripheralsOptions } from "#core/schemas/peripherals-options.schema";

/**
 * The point-of-sale peripherals configuration.
 *
 * @example
 * import { PeripheralsConfig as BasePeripheralsConfig } from "@stackra/peripherals";
 *
 * export class PeripheralsConfig extends BasePeripheralsConfig {
 *   override printer: DriverName<ReceiptPrinter> = "escpos";
 *   override drawer: DriverName<CashDrawer> = "printer_kick";
 *   override scanner: DriverName<BarcodeScanner> = "hid";
 *   override probeOnBoot = true;
 * }
 */
export class PeripheralsConfig extends Config({ schema: PeripheralsOptions }) {}
