/**
 * Stackra file contract:
 * Purpose: `POS_DEVICE_SDK`, the recorded vendor SDK answers the `./native` tests replay for each family: printer
 *          status codes (ready, out of paper, overheated, a fault) and `onScan` event payloads, with `install`, which
 *          puts a stand-in Expo module that replays them on `globalThis.expo`, and `uninstall`.
 * Boundary: test only. The codes are transcribed from the vendors' public SDK documents (Sunmi
 *           `updatePrinterState()`, PAX NeptuneLite `IPrinter.getStatus()`, iMin `getPrinterStatus()`); they are
 *           replaced by recordings from certified models at certification (STA-739). The module records every
 *           argument of every call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0458; ADR 0459; ADR 0460; ADR 0442 (decision 4); ADR 0022 (test placement).
 */
import { vi } from "vitest";

/** A scan event as the module emits it. */
type ScanEvent = { readonly code?: unknown };

/** The recorded SDK answers and the stand-in module. */
export const POS_DEVICE_SDK = {
  /** Each family's printer statuses; `fault` is Sunmi 505 no printer, PAX 4 malfunction, iMin -1 not connected. */
  status: {
    sunmi: { ready: 1, outOfPaper: 4, overheated: 5, fault: 505 },
    pax: { ready: 0, outOfPaper: 2, overheated: 8, fault: 4 },
    imin: { ready: 0, outOfPaper: 7, overheated: 5, fault: -1 },
  },

  /** `onScan` payloads: a decoded EAN-13, a GS1 element string, and payloads the bridge must drop. */
  scan: {
    ean13: { code: "6291041500213" },
    gs1: { code: "01062910415002133103001250" },
    empty: { code: "" },
    notText: { code: 6291041500213 },
    missing: {},
  },

  /** Puts a stand-in module named `module` on the Expo registry that answers `status`. */
  install(module: string, status: number) {
    const listeners: Array<(event: ScanEvent) => void> = [];
    const remove = vi.fn();
    const device = {
      printerStatus: vi.fn(async () => status),
      printLines: vi.fn(async (_lines: readonly string[]) => undefined),
      openDrawer: vi.fn(async () => undefined),
      addListener: vi.fn((_eventName: "onScan", listener: (event: ScanEvent) => void) => {
        listeners.push(listener);
        return { remove };
      }),
      /** Replays a recorded scan event to every listener. */
      emit(event: ScanEvent): void {
        for (const listener of listeners) listener(event);
      },
      remove,
    };
    (globalThis as { expo?: unknown }).expo = { modules: { [module]: device } };
    return device;
  },

  /** Removes the stand-in registry. */
  uninstall(): void {
    delete (globalThis as { expo?: unknown }).expo;
  },
} as const;
