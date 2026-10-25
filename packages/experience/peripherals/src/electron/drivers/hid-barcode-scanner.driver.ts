/**
 * Stackra file contract:
 * Purpose: `HidBarcodeScannerDriver`, the `BarcodeScanner` driver of the desktop main process (`peripherals.scanner:
 *          "hid"`): a USB or Bluetooth HID scanner in keyboard-wedge mode types each code and an Enter, and main reads
 *          those keystrokes from every window's `before-input-event` with no native module.
 * Boundary: main only. A burst counts as a scan when every key follows the previous one within
 *           `peripherals.scanKeyGap`, has at least three characters and ends with Enter; slower typing and held keys
 *           never do. It observes keys without swallowing them, so a focused field still receives the code. Electron
 *           loads on the first subscription, so the entry stays loadable in the renderer.
 * Runtime: node
 * Governing contract: ADR 0253 (decisions 2 to 4: HID scanner, no native module); ADR 0250 (decision 3); ADR 0251
 *                     (decision 3: the renderer keeps no Node).
 */
import { Driver } from "@stackra/container";
import { Clock, Duration } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";
import type { Input, WebContents } from "electron";

import { PeripheralsConfig } from "#config/peripherals.config";
import { BarcodeScanner } from "#contracts/ports/barcode-scanner.port";

/** The shortest code a burst must type to count as a scan. */
const MIN_CODE = 3;

/**
 * A keyboard-wedge HID scanner read in main.
 *
 * @example
 * // generated main-process wiring, desktop target
 * { port: BarcodeScanner, selectedBy: "config:peripherals.scanner", candidates: { hid: () => import("@stackra/peripherals/electron").then((m) => m.HidBarcodeScannerDriver) } }
 */
export class HidBarcodeScannerDriver extends Driver(BarcodeScanner) {
  /** The peripherals configuration, for the key gap. */
  private readonly config: PeripheralsConfig;

  /** When each key arrived. */
  private readonly clock: Clock;

  /** The subscribed listeners. */
  private readonly listeners = new Set<(code: string) => void>();

  /** The characters of the burst so far. */
  private buffer = "";

  /** When the previous key arrived, in epoch milliseconds. */
  private lastKeyAt = 0;

  /** Removes the input listeners; set while listening. */
  private detach: (() => void) | undefined = undefined;

  /**
   * @param config - the peripherals configuration.
   * @param clock - the time source each keystroke is stamped with.
   */
  constructor(config: PeripheralsConfig, clock: Clock) {
    super();
    this.config = config;
    this.clock = clock;
  }

  /** A wedge scanner is a keyboard: there is nothing to ask, so it always answers. */
  async probe(): Promise<CapabilityResult> {
    return { ok: true, data: undefined };
  }

  /** Subscribes `listener`; main starts reading keys with the first listener and stops after the last. */
  onScan(listener: (code: string) => void): () => void {
    this.listeners.add(listener);
    if (this.listeners.size === 1) void this.attach();
    return () => {
      if (!this.listeners.delete(listener) || this.listeners.size > 0) return;
      this.detach?.();
      this.detach = undefined;
    };
  }

  /** Watches every web contents, now and later, for keystrokes. */
  private async attach(): Promise<void> {
    const { app, webContents } = await import("electron");
    if (this.listeners.size === 0 || this.detach !== undefined) return;
    const onInput = (_event: unknown, input: Input): void => this.accept(input);
    const watched = new Set<WebContents>();
    const watch = (contents: WebContents): void => {
      watched.add(contents);
      contents.on("before-input-event", onInput);
    };
    const onCreated = (_event: unknown, contents: WebContents): void => watch(contents);
    for (const contents of webContents.getAllWebContents()) watch(contents);
    app.on("web-contents-created", onCreated);
    this.detach = () => {
      app.off("web-contents-created", onCreated);
      for (const contents of watched)
        if (!contents.isDestroyed()) contents.off("before-input-event", onInput);
    };
  }

  /** Adds one keystroke to the burst, and hands a finished scan to the listeners. */
  private accept(input: Input): void {
    if (input.type !== "keyDown") return;
    const now = this.clock.now().getTime();
    const isLate = now - this.lastKeyAt > Duration.toMilliseconds(this.config.scanKeyGap);
    this.lastKeyAt = now;
    if (input.isAutoRepeat || isLate) this.buffer = "";
    if (input.isAutoRepeat) return;
    if (input.key === "Enter") {
      const code = this.buffer;
      this.buffer = "";
      if (code.length >= MIN_CODE) for (const listener of this.listeners) listener(code);
      return;
    }
    if (input.key.length === 1 && !input.control && !input.meta && !input.alt)
      this.buffer += input.key;
  }
}
