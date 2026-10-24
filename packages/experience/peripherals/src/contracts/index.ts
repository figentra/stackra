/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/peripherals, the leaf entry of its four ports and the
 *          types their signatures name, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf: it imports no other entry of this package. The
 *           ports are exported from here only, never from `.` (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { BarcodeScanner } from "#contracts/ports/barcode-scanner.port";
export { CashDrawer } from "#contracts/ports/cash-drawer.port";
export { ReceiptPrinter } from "#contracts/ports/receipt-printer.port";
export { Scale } from "#contracts/ports/scale.port";
export type { DrawerPin } from "#contracts/types/drawer-pin.type";
export type { PrintedReceipt } from "#contracts/types/printed-receipt.type";
export type { Receipt } from "#contracts/types/receipt.type";
export type { ScaleReading } from "#contracts/types/scale-reading.type";
