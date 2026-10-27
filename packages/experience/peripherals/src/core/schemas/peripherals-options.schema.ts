/**
 * Stackra file contract:
 * Purpose: `PeripheralsOptions`, the shape of `PeripheralsConfig`: which driver each point-of-sale port takes, where
 *          the receipt and label printers are, the named kitchen printers with the stations each serves and its
 *          buzzer, the bump bar's key map, the scale presets and the one in use, which pin the drawer hangs on, how
 *          fast a wedge scanner types, and whether the app probes the devices at boot. The scanner-scale,
 *          bagging-scale, label-scale and drive-through lane ports take a driver field each (STA-965).
 * Boundary: a shape class; it registers this package's own schema (`PERIPHERALS_CONFIG_SCHEMA`) for itself when the
 *           module loads, so `buildConfig(PeripheralsConfig)` validates with no generated file. Every default is the
 *           `memory` driver and no device, so a member that never configures peripherals touches no hardware.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 26); ADR 0253 (decision 4); ADR 0266 (decisions 1 and 5); ADR
 *                     0449 (decisions 1 to 4); STA-965.
 */
import "#core/types/peripheral-driver-registry.type";
import type { DriverName } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";

import { BumpBarKey } from "#contracts/enums/bump-bar-key.enum";
import type { BarcodeScanner } from "#contracts/ports/barcode-scanner.port";
import type { BumpBar } from "#contracts/ports/bump-bar.port";
import type { CardTerminal } from "#contracts/ports/card-terminal.port";
import type { AccessController } from "#contracts/ports/access-controller.port";
import type { CashDrawer } from "#contracts/ports/cash-drawer.port";
import type { CustomerDisplay } from "#contracts/ports/customer-display.port";
import type { KitchenPrinter } from "#contracts/ports/kitchen-printer.port";
import type { LabelPrinter } from "#contracts/ports/label-printer.port";
import type { BaggingScale } from "#contracts/ports/bagging-scale.port";
import type { DriveThroughLane } from "#contracts/ports/drive-through-lane.port";
import type { LabelScale } from "#contracts/ports/label-scale.port";
import type { ReceiptPrinter } from "#contracts/ports/receipt-printer.port";
import type { ScannerScale } from "#contracts/ports/scanner-scale.port";
import type { UsedReceiptStore } from "#contracts/ports/used-receipt-store.port";
import type { DrawerPin } from "#contracts/types/drawer-pin.type";
import type { ScalePreset } from "#contracts/types/scale-preset.type";
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

  /** The label printer driver: `zpl` (desktop) or `memory`. */
  labelPrinter: DriverName<LabelPrinter> = "memory";

  /**
   * The customer display driver: `channel` (a second window of the app), `external` (the native app's Android
   * Presentation or iPad external-display scene) or `memory`.
   */
  customerDisplay: DriverName<CustomerDisplay> = "memory";

  /**
   * The card terminal driver: `ecr` (a semi-integrated terminal on the shop's network, the link of the payments ECR
   * driver, ADR 0377) or `memory`.
   */
  cardTerminal: DriverName<CardTerminal> = "memory";

  /** The gate driver: `memory` until a gate controller's driver ships with its ADR. */
  accessController: DriverName<AccessController> = "memory";

  /** The kitchen ticket printer driver: `escpos` (desktop, the named printers below) or `memory`. */
  kitchenPrinter: DriverName<KitchenPrinter> = "memory";

  /** The bump bar driver: `hid` (a keyboard-wedge keypad read in main) or `memory`. */
  bumpBar: DriverName<BumpBar> = "memory";

  /** Where exit gates record used receipts: `memory` (this gate only) until a shared store ships. */
  usedReceiptStore: DriverName<UsedReceiptStore> = "memory";

  /** The till's scanner-scale driver: `memory` until a vendor's driver ships with its ADR. */
  scannerScale: DriverName<ScannerScale> = "memory";

  /** The self-checkout bagging scale driver: `memory` until a lane vendor's driver ships with its ADR. */
  baggingScale: DriverName<BaggingScale> = "memory";

  /** The label scale sync driver: `memory` until a vendor protocol's driver ships with its ADR. */
  labelScale: DriverName<LabelScale> = "memory";

  /** The drive-through lane driver (car sensor, confirm board): `memory` until a vendor's driver ships with its ADR. */
  driveThroughLane: DriverName<DriveThroughLane> = "memory";

  /** Where the `escpos` driver sends receipts: `tcp://<host>:<port>`, a device path, or empty for no printer. */
  printerAddress = "";

  /** Where the `zpl` driver sends labels: `tcp://<host>:<port>`, a device path, or empty for no label printer. */
  labelPrinterAddress = "";

  /**
   * The kitchen ticket printers by name (`grill`, `cold_line`): each one's address, the stations it prints for (a
   * station is on one printer at most) and its buzzer, `times` beeps of `length` steps of 50 ms (1 to 9 each), or null.
   */
  kitchenPrinters: Record<
    string,
    {
      /** `tcp://<host>:<port>` or a device path. */
      address: string;
      /** The station keys it prints for. */
      stations: string[];
      /** The buzzer after each ticket, or null for none. */
      buzz: { times: number; length: number } | null;
    }
  > = {};

  /** What each bump bar key does, keyed by the key the keypad types (Electron's `input.key`). */
  bumpBarKeys: Record<string, BumpBarKey> = {
    Enter: BumpBarKey.Bump,
    r: BumpBarKey.Recall,
    ArrowRight: BumpBarKey.Next,
    ArrowLeft: BumpBarKey.Previous,
    " ": BumpBarKey.Select,
  };

  /** The scale profiles by name; `retail` and `precision` ship. */
  scalePresets: Record<string, ScalePreset> = {
    retail: { division: 1, capacity: 15_000 },
    precision: { division: 0.01, capacity: 600 },
  };

  /** The scale profile this device uses, a key of `scalePresets`. */
  scalePreset = "retail";

  /** The printer's drawer connector pin the drawer is wired to. */
  drawerPin: DrawerPin = 2;

  /** The longest pause between a wedge scanner's keystrokes; a slower burst is a person typing. */
  scanKeyGap: Duration = Duration.seconds(0.05);

  /** Probe each bound peripheral at boot so the capability gate reflects what is plugged in. */
  probeOnBoot = false;

  /** The public key exit gates check receipt tokens with (raw Ed25519, base64url); empty on a site with no gate. */
  exitTokenPublicKey = "";

  /** How long after its sale a receipt token still opens an exit gate (a venue setting). */
  exitTokenMaxAge: Duration = Duration.minutes(30);
}

registerSchemas([[PeripheralsOptions, PERIPHERALS_CONFIG_SCHEMA]]);
