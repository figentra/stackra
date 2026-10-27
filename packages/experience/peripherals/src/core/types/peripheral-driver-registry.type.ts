/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entries of the selectable peripheral ports, so `PeripheralsConfig`'s driver
 *          fields (typed `DriverName<Port>`) and a runway `peripherals.*` value take exactly this package's driver
 *          names.
 * Boundary: a module augmentation only; the stand-in for the entries this package's generated wiring writes (ADR 0263
 *           decision 9). `PeripheralsOptions` imports this file so the augmentation travels with the shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9); ADR 0449; STA-965; ADR 0377.
 */
import type { PERIPHERAL_DRIVERS } from "#core/constants/peripheral-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `ReceiptPrinter` (`memory`, `escpos`). */
    "peripherals.ReceiptPrinter": (typeof PERIPHERAL_DRIVERS.printer)[number];
    /** The driver names of `CashDrawer` (`memory`, `printer_kick`). */
    "peripherals.CashDrawer": (typeof PERIPHERAL_DRIVERS.drawer)[number];
    /** The driver names of `BarcodeScanner` (`memory`, `hid`). */
    "peripherals.BarcodeScanner": (typeof PERIPHERAL_DRIVERS.scanner)[number];
    /** The driver names of `LabelPrinter` (`memory`, `zpl`). */
    "peripherals.LabelPrinter": (typeof PERIPHERAL_DRIVERS.labelPrinter)[number];
    /** The driver names of `CustomerDisplay` (`memory`, `channel`, `external`). */
    "peripherals.CustomerDisplay": (typeof PERIPHERAL_DRIVERS.customerDisplay)[number];
    /** The driver names of `CardTerminal` (`memory`, `ecr`). */
    "peripherals.CardTerminal": (typeof PERIPHERAL_DRIVERS.cardTerminal)[number];
    /** The driver names of `AccessController` (`memory`). */
    "peripherals.AccessController": (typeof PERIPHERAL_DRIVERS.accessController)[number];
    /** The driver names of `KitchenPrinter` (`memory`, `escpos`). */
    "peripherals.KitchenPrinter": (typeof PERIPHERAL_DRIVERS.kitchenPrinter)[number];
    /** The driver names of `BumpBar` (`memory`, `hid`). */
    "peripherals.BumpBar": (typeof PERIPHERAL_DRIVERS.bumpBar)[number];
    /** The driver names of `UsedReceiptStore` (`memory`). */
    "peripherals.UsedReceiptStore": (typeof PERIPHERAL_DRIVERS.usedReceiptStore)[number];
    /** The driver names of `ScannerScale` (`memory`). */
    "peripherals.ScannerScale": (typeof PERIPHERAL_DRIVERS.scannerScale)[number];
    /** The driver names of `BaggingScale` (`memory`). */
    "peripherals.BaggingScale": (typeof PERIPHERAL_DRIVERS.baggingScale)[number];
    /** The driver names of `LabelScale` (`memory`). */
    "peripherals.LabelScale": (typeof PERIPHERAL_DRIVERS.labelScale)[number];
    /** The driver names of `DriveThroughLane` (`memory`). */
    "peripherals.DriveThroughLane": (typeof PERIPHERAL_DRIVERS.driveThroughLane)[number];
  }
}
