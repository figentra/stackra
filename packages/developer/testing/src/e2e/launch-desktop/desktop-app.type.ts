/**
 * Stackra file contract:
 * Purpose: `DesktopApp`, what `launchDesktop` resolves: Playwright's Electron application plus `openUrl`, which hands
 *          main a deep link as the operating system would.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0251; ADR 0255 (deep links); ADR 0269 (decision 6).
 */
import type { ElectronApplication } from "@playwright/test";

/** A launched desktop app. */
export type DesktopApp = ElectronApplication & {
  /** Delivers `url` (`acme-console://orders/orders/ord_1`) to main as an `open-url` event. */
  openUrl(url: string): Promise<void>;
};
