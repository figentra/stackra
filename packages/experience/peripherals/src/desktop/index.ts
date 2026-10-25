/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./desktop` entry of @stackra/peripherals: the receipt and label bridges main binds
 *          behind `ReceiptPrinter` and `LabelPrinter`, and the main-process drivers of the POS kit (ESC/POS receipt
 *          printer, drawer kick through the printer, keyboard-wedge HID scanner, ZPL label printer), until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Loadable anywhere: no module here imports Electron or a Node
 *           module at load time (each loads it when it runs). `sendToPrinter` stays internal.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (`./desktop` entry, registry Q4); ADR 0253;
 *                     ADR 0339; the STA-347 stand-in barrel decision.
 */
export { PrintLabelBridge } from "#desktop/bridges/print-label.bridge";
export { PrintReceiptBridge } from "#desktop/bridges/print-receipt.bridge";
export { EscposReceiptPrinterDriver } from "#desktop/drivers/escpos-receipt-printer.driver";
export { HidBarcodeScannerDriver } from "#desktop/drivers/hid-barcode-scanner.driver";
export { PrinterKickCashDrawerDriver } from "#desktop/drivers/printer-kick-cash-drawer.driver";
export { ZplLabelPrinterDriver } from "#desktop/drivers/zpl-label-printer.driver";
