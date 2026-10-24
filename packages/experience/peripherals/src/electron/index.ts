/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./electron` entry of @stackra/peripherals: the print bridge main binds behind
 *          `ReceiptPrinter`, and the main-process drivers of the POS kit (ESC/POS printer, drawer kick through the
 *          printer, keyboard-wedge HID scanner), until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Loadable anywhere: no module here imports Electron or a Node
 *           module at load time (each loads it when it runs).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (`./electron` entry, registry Q4); ADR 0253;
 *                     the STA-347 stand-in barrel decision.
 */
export { PrintReceiptBridge } from "#electron/bridges/print-receipt.bridge";
export { EscposReceiptPrinterDriver } from "#electron/drivers/escpos-receipt-printer.driver";
export { HidBarcodeScannerDriver } from "#electron/drivers/hid-barcode-scanner.driver";
export { PrinterKickCashDrawerDriver } from "#electron/drivers/printer-kick-cash-drawer.driver";
