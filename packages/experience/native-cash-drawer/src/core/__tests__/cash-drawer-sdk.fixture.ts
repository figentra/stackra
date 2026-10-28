/**
 * Stackra file contract:
 * Purpose: `CASH_DRAWER_SDK`, the recorded vendor SDK answers the drawer tests replay for each family (the printer
 *          that drives the drawer ready, out of paper, a fault), with `install`, which puts a stand-in
 *          `StackraCashDrawer` Expo module that answers them on `globalThis.expo`, and `uninstall`.
 * Boundary: test only. The codes are transcribed from the vendors' public SDK documents (Sunmi
 *           `updatePrinterState()`, PAX NeptuneLite `IPrinter.getStatus()`); they are replaced by recordings from
 *           certified models at certification (STA-739). The module records every argument of every call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0478 (decision 5); ADR 0458; ADR 0459; ADR 0022 (test placement).
 */
import type { Mock } from "vitest";
import { vi } from "vitest";

import type { CashDrawerNativeModule } from "#core/types/cash-drawer-native-module.type";

/** The stand-in module: each `CashDrawerNativeModule` method as a recording mock. */
type StandInDrawer = {
  readonly [K in keyof CashDrawerNativeModule]: Mock<CashDrawerNativeModule[K]>;
};

/** Each family's printer statuses; `fault` is Sunmi 505 no printer, PAX 4 malfunction. */
const STATUS = {
  sunmi: { ready: 1, outOfPaper: 4, fault: 505 },
  pax: { ready: 0, outOfPaper: 2, fault: 4 },
} as const;

/** The fixture's written type: the declaration build cannot name vitest's internal `Procedure` from an inferred one. */
interface CashDrawerSdk {
  readonly status: typeof STATUS;
  /** Puts a stand-in module on the Expo registry that answers `status`. */
  install: (status: number) => StandInDrawer;
  /** Removes the stand-in registry. */
  uninstall: () => void;
}

/** The recorded SDK answers and the stand-in module. */
export const CASH_DRAWER_SDK: CashDrawerSdk = {
  status: STATUS,

  /** Puts a stand-in module on the Expo registry that answers `status`. */
  install(status: number): StandInDrawer {
    const module: StandInDrawer = {
      status: vi.fn<CashDrawerNativeModule["status"]>(async () => status),
      open: vi.fn<CashDrawerNativeModule["open"]>(async () => undefined),
    };
    (globalThis as { expo?: unknown }).expo = { modules: { StackraCashDrawer: module } };
    return module;
  },

  /** Removes the stand-in registry. */
  uninstall(): void {
    delete (globalThis as { expo?: unknown }).expo;
  },
};
