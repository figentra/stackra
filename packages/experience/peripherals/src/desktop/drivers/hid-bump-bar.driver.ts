/**
 * Stackra file contract:
 * Purpose: `HidBumpBarDriver`, the `BumpBar` driver of the desktop main process (`peripherals.bumpBar: "hid"`): a USB
 *          bump bar is a keypad that types keys, and main reads them from every window's `before-input-event` with no
 *          native module, handing each mapped key to the listeners as a `BumpBarKey`.
 * Boundary: main only. `peripherals.bumpBarKeys` maps a typed key (Electron's `input.key`) to its action
 *           (configuration: each keypad model is a map, not code); unmapped keys, held keys and keys with a modifier
 *           are ignored. It observes keys without swallowing them. Electron loads on the first subscription, so the
 *           entry stays loadable in the renderer.
 * Runtime: node
 * Governing contract: ADR 0253 (decisions 2 to 4); ADR 0250 (decision 3); ADR 0251 (decision 3); ADR 0449
 *                     (decision 2).
 */
import { Driver } from "@stackra/container";
import type { CapabilityResult } from "@stackra/platform/contracts";
import type { Input, WebContents } from "electron";

import type { PeripheralsConfig } from "#config/peripherals.config";
import type { BumpBarKey } from "#contracts/enums/bump-bar-key.enum";
import { BumpBar } from "#contracts/ports/bump-bar.port";

/**
 * A keypad bump bar read in main.
 *
 * @example
 * // generated main-process wiring, desktop target
 * { port: BumpBar, selectedBy: "config:peripherals.bumpBar", candidates: { hid: () => import("@stackra/peripherals/desktop").then((m) => m.HidBumpBarDriver) } }
 */
export class HidBumpBarDriver extends Driver(BumpBar) {
  /** The peripherals configuration, for the key map. */
  private readonly config: PeripheralsConfig;

  /** The subscribed listeners. */
  private readonly listeners = new Set<(key: BumpBarKey) => void>();

  /** Removes the input listeners; set while listening. */
  private detach: (() => void) | undefined = undefined;

  /**
   * @param config - the peripherals configuration.
   */
  constructor(config: PeripheralsConfig) {
    super();
    this.config = config;
  }

  /** A keypad is a keyboard: there is nothing to ask, so it always answers. */
  async probe(): Promise<CapabilityResult> {
    return { ok: true, data: undefined };
  }

  /** Subscribes `listener`; main starts reading keys with the first listener and stops after the last. */
  onKey(listener: (key: BumpBarKey) => void): () => void {
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

  /** Hands one mapped key press to the listeners. */
  private accept(input: Input): void {
    if (input.type !== "keyDown" || input.isAutoRepeat) return;
    if (input.control || input.meta || input.alt) return;
    const key = this.config.bumpBarKeys[input.key];
    if (key === undefined) return;
    for (const listener of this.listeners) listener(key);
  }
}
