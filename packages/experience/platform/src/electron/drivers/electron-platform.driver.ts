/**
 * Stackra file contract:
 * Purpose: `ElectronPlatformDriver`, the `Platform` driver of the desktop renderer: the renderer is Chromium, so every
 *          web capability stays as `WebPlatformDriver` detects it, and the desktop adds windows, the tray, shell
 *          updates and saving to a picked folder, which main provides through bridges (ADR 0281 decision 2).
 * Boundary: renderer only; it touches no Electron module. The desktop capabilities are offered only when the
 *           generated preload exposed `window.stackra`, so the same build opened in a plain browser offers the web
 *           set. Desktop work itself (tray, overlays, updates) runs in main from `DesktopConfig`.
 * Runtime: browser
 * Governing contract: ADR 0250 (decisions 2 and 3); ADR 0281 (decision 2); ADR 0251 (decision 3: context isolation,
 *                     only the preload's API).
 */
import { Capability } from "#core/enums/capability.enum";
import { WebPlatformDriver } from "#browser/drivers/web-platform.driver";

/** What the desktop shell adds to the web set. */
const DESKTOP: ReadonlySet<string> = new Set([
  Capability.Window,
  Capability.Tray,
  Capability.Updates,
  Capability.FilesSave,
]);

/**
 * The platform in the Electron renderer.
 *
 * @example
 * // generated wiring, desktop target
 * { port: Platform, candidates: { electron: () => import("@stackra/platform/electron").then((m) => m.ElectronPlatformDriver) } }
 */
export class ElectronPlatformDriver extends WebPlatformDriver {
  /** The web set, plus the desktop capabilities once the preload's bridge API is present. */
  override has(capability: string): boolean {
    if (DESKTOP.has(capability) && "stackra" in globalThis) return true;
    return super.has(capability);
  }
}
