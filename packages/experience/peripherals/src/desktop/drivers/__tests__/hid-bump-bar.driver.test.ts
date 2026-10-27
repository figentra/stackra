/**
 * Stackra file contract:
 * Purpose: unit tests of `HidBumpBarDriver`: a mapped key in any window, open now or later, reaches the listeners as
 *          its `BumpBarKey`; unmapped keys, held keys, key-ups and keys with a modifier do not; a configured map
 *          replaces the default; the last unsubscribe removes every input listener; the probe always answers.
 * Boundary: test only; Electron is mocked with event emitters.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0253 (decisions 2 to 4); ADR 0449 (decision 2).
 */
import { buildConfig } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PeripheralsConfig } from "#config/peripherals.config";
import { BumpBar } from "#contracts/ports/bump-bar.port";
import { HidBumpBarDriver } from "#desktop/drivers/hid-bump-bar.driver";

const electron = await vi.hoisted(async () => {
  const { EventEmitter } = await import("node:events");
  return {
    EventEmitter,
    app: new EventEmitter(),
    windows: [] as InstanceType<typeof EventEmitter>[],
  };
});

vi.mock("electron", () => ({
  app: electron.app,
  webContents: { getAllWebContents: () => electron.windows },
}));

/** A window's web contents. */
function webContents(): InstanceType<typeof electron.EventEmitter> {
  return Object.assign(new electron.EventEmitter(), { isDestroyed: () => false });
}

/** Presses `key` in `target`, with `extra` input fields. */
function press(
  target: InstanceType<typeof electron.EventEmitter>,
  key: string,
  extra: Record<string, unknown> = {},
): void {
  target.emit("before-input-event", {}, { type: "keyDown", key, isAutoRepeat: false, ...extra });
}

describe("HidBumpBarDriver", () => {
  it("hands mapped keys from any window to the listeners, and detaches after the last", async () => {
    const first = webContents();
    electron.windows.splice(0, Infinity, first);
    const bar = new HidBumpBarDriver(buildConfig(PeripheralsConfig));
    expect(bar).toBeInstanceOf(BumpBar);
    expect(await bar.probe()).toEqual({ ok: true, data: undefined });
    const seen: string[] = [];
    const stop = bar.onKey((key) => seen.push(key));
    await vi.waitFor(() => expect(first.listenerCount("before-input-event")).toBe(1));

    press(first, "Enter");
    const later = webContents();
    electron.app.emit("web-contents-created", {}, later);
    press(later, "ArrowLeft");
    press(later, "x");
    press(later, "Enter", { isAutoRepeat: true });
    press(later, "Enter", { control: true });
    later.emit("before-input-event", {}, { type: "keyUp", key: "Enter", isAutoRepeat: false });
    expect(seen).toEqual(["bump", "previous"]);

    stop();
    expect(first.listenerCount("before-input-event")).toBe(0);
    expect(later.listenerCount("before-input-event")).toBe(0);
    expect(electron.app.listenerCount("web-contents-created")).toBe(0);
  });

  it("reads a configured key map instead of the default", async () => {
    const target = webContents();
    electron.windows.splice(0, Infinity, target);
    const bar = new HidBumpBarDriver(
      buildConfig(PeripheralsConfig, { values: { bumpBarKeys: { "1": "bump", "9": "recall" } } }),
    );
    const seen: string[] = [];
    const stop = bar.onKey((key) => seen.push(key));
    await vi.waitFor(() => expect(target.listenerCount("before-input-event")).toBe(1));
    press(target, "Enter");
    press(target, "9");
    press(target, "1");
    expect(seen).toEqual(["recall", "bump"]);
    stop();
  });
});
