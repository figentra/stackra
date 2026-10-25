/**
 * Stackra file contract:
 * Purpose: `PeripheralsOptions`, the shape of `PeripheralsConfig`: which driver each point-of-sale port takes, where
 *          the receipt printer is, which pin the drawer hangs on, how fast a wedge scanner types, and whether the
 *          app probes the devices at boot.
 * Boundary: a shape class; it registers this package's own schema (`PERIPHERALS_CONFIG_SCHEMA`) for itself when the
 *           module loads, so `buildConfig(PeripheralsConfig)` validates with no generated file. Every default is the
 *           `memory` driver and no device, so a member that never configures peripherals touches no hardware.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 26); ADR 0253 (decision 4); ADR 0266 (decisions 1 and 5).
 */
import "#core/types/peripheral-driver-registry.type";
import type { DriverName } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";

import type { BarcodeScanner } from "#contracts/ports/barcode-scanner.port";
import type { CashDrawer } from "#contracts/ports/cash-drawer.port";
import type { ReceiptPrinter } from "#contracts/ports/receipt-printer.port";
import type { DrawerPin } from "#contracts/types/drawer-pin.type";
import { PERIPHERALS_CONFIG_SCHEMA } from "#core/constants/peripherals-config-schema.constant";

/**
 * The point-of-sale peripheral settings.
 *
 * @example
 * export class PeripheralsConfig extends BasePeripheralsConfig {
 *   override printer: DriverName<ReceiptPrinter> = "escpos";
 *   override printerAddress = "tcp://10.0.0.20:9100";
 * }
 */
export class PeripheralsOptions extends Schema {
  /** The receipt printer driver: `escpos` (desktop) or `memory`. */
  printer: DriverName<ReceiptPrinter> = "memory";

  /** The cash drawer driver: `printer_kick` (through the printer) or `memory`. */
  drawer: DriverName<CashDrawer> = "memory";

  /** The barcode scanner driver: `hid` (keyboard wedge, desktop) or `memory`. */
  scanner: DriverName<BarcodeScanner> = "memory";

  /** Where the `escpos` driver sends receipts: `tcp://<host>:<port>`, a device path, or empty for no printer. */
  printerAddress = "";

  /** The printer's drawer connector pin the drawer is wired to. */
  drawerPin: DrawerPin = 2;

  /** The longest pause between a wedge scanner's keystrokes; a slower burst is a person typing. */
  scanKeyGap: Duration = Duration.seconds(0.05);

  /** Probe each bound peripheral at boot so the capability gate reflects what is plugged in. */
  probeOnBoot = false;
}

registerSchemas([[PeripheralsOptions, PERIPHERALS_CONFIG_SCHEMA]]);
