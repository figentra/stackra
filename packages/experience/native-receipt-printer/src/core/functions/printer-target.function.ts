/**
 * Stackra file contract:
 * Purpose: `printerTarget`, the vendor SDK's target string for a vendor and `peripherals.printerAddress`: empty for a
 *          built-in printer, the prefixed host of a `tcp://<host>:<port>` address for a network printer (Epson
 *          `TCP:10.0.0.20`, Star `10.0.0.20`).
 * Boundary: internal; not exported from the entry. A network vendor with no address or a device path answers
 *           `undefined` (the caller refuses): Bluetooth and USB targets are not built. The port is not passed: both
 *           SDKs use the printer's own port.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5); ADR 0253 (decision 4).
 */
import type { ReceiptPrinterVendor } from "#core/types/receipt-printer-vendor.type";

/** A network address: `tcp://<host>:<port>`. */
const NETWORK_ADDRESS = /^tcp:\/\/([^\s/:]+|\[[^\]\s]+\]):\d{1,5}$/;

/**
 * The SDK target of `vendor`'s printer at `address`, or `undefined` when it cannot be reached from it.
 *
 * @example
 * printerTarget(RECEIPT_PRINTER_VENDORS.epson, "tcp://10.0.0.20:9100"); // "TCP:10.0.0.20"
 */
export function printerTarget(vendor: ReceiptPrinterVendor, address: string): string | undefined {
  if (vendor.reach === "built-in") return "";
  const host = NETWORK_ADDRESS.exec(address)?.[1];
  return host === undefined ? undefined : `${vendor.targetPrefix}${host}`;
}
