/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./desktop` entry of @stackra/peripherals: the receipt, label and kitchen ticket
 *          bridges main binds behind `ReceiptPrinter`, `LabelPrinter` and `KitchenPrinter`, and the main-process
 *          drivers of the POS kit (ESC/POS receipt printer, drawer kick through the printer, keyboard-wedge HID
 *          scanner, ZPL label printer, named ESC/POS kitchen printers, keypad bump bar, and the `ecr` semi-integrated card terminal link of ADR 0377), until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Loadable anywhere: no module here imports Electron or a Node
 *           module at load time (each loads it when it runs). `sendToPrinter` stays internal.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (`./desktop` entry, registry Q4); ADR 0253;
 *                     ADR 0339; ADR 0377; ADR 0449; the STA-347 stand-in barrel decision.
 */
export { PrintKitchenTicketBridge } from "#desktop/bridges/print-kitchen-ticket.bridge";
export { PrintLabelBridge } from "#desktop/bridges/print-label.bridge";
export { PrintReceiptBridge } from "#desktop/bridges/print-receipt.bridge";
export { EscposReceiptPrinterDriver } from "#desktop/drivers/escpos-receipt-printer.driver";
export { EcrCardTerminalDriver } from "#desktop/drivers/ecr-card-terminal.driver";
export { EscposKitchenPrinterDriver } from "#desktop/drivers/escpos-kitchen-printer.driver";
export { HidBarcodeScannerDriver } from "#desktop/drivers/hid-barcode-scanner.driver";
export { HidBumpBarDriver } from "#desktop/drivers/hid-bump-bar.driver";
export { ZplLabelPrinterDriver } from "#desktop/drivers/zpl-label-printer.driver";
