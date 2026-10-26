/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/peripherals, the leaf entry of its ports, enums and the
 *          types their signatures name, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf: it imports no other entry of this package. The
 *           ports are exported from here only, never from `.` (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { LabelFormat } from "#contracts/enums/label-format.enum";
export { TerminalState } from "#contracts/enums/terminal-state.enum";
export { AccessController } from "#contracts/ports/access-controller.port";
export { BarcodeScanner } from "#contracts/ports/barcode-scanner.port";
export { CardTerminal } from "#contracts/ports/card-terminal.port";
export { CashDrawer } from "#contracts/ports/cash-drawer.port";
export { CustomerDisplay } from "#contracts/ports/customer-display.port";
export { LabelPrinter } from "#contracts/ports/label-printer.port";
export { ReceiptPrinter } from "#contracts/ports/receipt-printer.port";
export { Scale } from "#contracts/ports/scale.port";
export type { CustomerDisplayLine } from "#contracts/types/customer-display-line.type";
export type { CustomerDisplayView } from "#contracts/types/customer-display-view.type";
export type { DrawerPin } from "#contracts/types/drawer-pin.type";
export type { ExitDecision } from "#contracts/types/exit-decision.type";
export type { Label } from "#contracts/types/label.type";
export type { PairedTerminal } from "#contracts/types/paired-terminal.type";
export type { PrintedLabel } from "#contracts/types/printed-label.type";
export type { PrintedReceipt } from "#contracts/types/printed-receipt.type";
export type { RasterImage } from "#contracts/types/raster-image.type";
export type { Receipt } from "#contracts/types/receipt.type";
export type { ReceiptTokenClaims } from "#contracts/types/receipt-token-claims.type";
export type { ScaleReading } from "#contracts/types/scale-reading.type";
export type { TerminalPairing } from "#contracts/types/terminal-pairing.type";
