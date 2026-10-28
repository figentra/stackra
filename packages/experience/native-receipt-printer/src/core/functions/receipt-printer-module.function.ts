/**
 * Stackra file contract:
 * Purpose: `receiptPrinterModule`, the module binding: it reads the `StackraReceiptPrinter` Expo module from the app's
 *          modules registry at call time, so the drivers load with no native package and refuse where it is absent.
 * Boundary: internal; not exported from the entry. It only looks the module up: it calls nothing on it.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2 and 5); ADR 0430 (decision 1: the registry lookup).
 */
import { RECEIPT_PRINTER_MODULE } from "#core/constants/receipt-printer-module.constant";
import type { ReceiptPrinterNativeModule } from "#core/types/receipt-printer-native-module.type";

/** The Expo modules registry, where an Expo app's native modules are. */
interface ExpoGlobal {
  readonly expo?: { readonly modules?: Readonly<Record<string, unknown>> };
}

/**
 * The module, or `undefined` in a build that does not link it (web, desktop, a test without the stand-in).
 *
 * @example
 * const module = receiptPrinterModule();
 * if (module === undefined) return refuse(PlatformCapability.Print, "unavailable");
 */
export function receiptPrinterModule(): ReceiptPrinterNativeModule | undefined {
  return (globalThis as ExpoGlobal).expo?.modules?.[RECEIPT_PRINTER_MODULE] as
    | ReceiptPrinterNativeModule
    | undefined;
}
