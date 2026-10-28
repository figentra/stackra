/**
 * Stackra file contract:
 * Purpose: `RECEIPT_PRINTER_SDK`, the recorded vendor SDK answers the driver tests replay for each vendor (ready, out of
 *          paper or offline, a fault), with `install`, which puts a stand-in `StackraReceiptPrinter` Expo module that
 *          answers them on `globalThis.expo`, and `uninstall`.
 * Boundary: test only. The codes are transcribed from the vendors' public SDK documents (Epson
 *           `PrinterStatusInfo.online`, Star `hasError` as 0 or 1, Sunmi `updatePrinterState()`, PAX NeptuneLite
 *           `IPrinter.getStatus()`); they are replaced by recordings from certified models at certification (STA-739).
 *           The module records every argument of every call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0478 (decision 5); ADR 0458; ADR 0459; ADR 0022 (test placement).
 */
import type { Mock } from "vitest";
import { vi } from "vitest";

import type { ReceiptPrinterNativeModule } from "#core/types/receipt-printer-native-module.type";

/** The stand-in module: each `ReceiptPrinterNativeModule` method as a recording mock. */
type StandInPrinter = {
  readonly [K in keyof ReceiptPrinterNativeModule]: Mock<ReceiptPrinterNativeModule[K]>;
};

/** Each vendor's statuses; `fault` is Epson offline, Star an error, Sunmi 505 no printer, PAX 4 malfunction. */
const STATUS = {
  epson: { ready: 1, fault: 0 },
  star: { ready: 0, fault: 1 },
  sunmi: { ready: 1, outOfPaper: 4, fault: 505 },
  pax: { ready: 0, outOfPaper: 2, fault: 4 },
} as const;

/** The fixture's written type: the declaration build cannot name vitest's internal `Procedure` from an inferred one. */
interface ReceiptPrinterSdk {
  readonly status: typeof STATUS;
  /** Puts a stand-in module on the Expo registry that answers `status`. */
  install: (status: number) => StandInPrinter;
  /** Removes the stand-in registry. */
  uninstall: () => void;
}

/** The recorded SDK answers and the stand-in module. */
export const RECEIPT_PRINTER_SDK: ReceiptPrinterSdk = {
  status: STATUS,

  /** Puts a stand-in module on the Expo registry that answers `status`. */
  install(status: number): StandInPrinter {
    const module: StandInPrinter = {
      status: vi.fn<ReceiptPrinterNativeModule["status"]>(async () => status),
      printLines: vi.fn<ReceiptPrinterNativeModule["printLines"]>(async () => undefined),
      kickDrawer: vi.fn<ReceiptPrinterNativeModule["kickDrawer"]>(async () => undefined),
    };
    (globalThis as { expo?: unknown }).expo = { modules: { StackraReceiptPrinter: module } };
    return module;
  },

  /** Removes the stand-in registry. */
  uninstall(): void {
    delete (globalThis as { expo?: unknown }).expo;
  },
};
