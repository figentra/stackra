/**
 * Stackra file contract:
 * Purpose: unit tests of `HidBarcodeScannerDriver`: a fast burst ending in Enter in any window, open now or later, is a
 *          scan; slow typing, a short burst, held keys and shortcuts are not; the last unsubscribe removes every input
 *          listener; the probe always answers.
 * Boundary: test only; Electron is mocked with event emitters and the clock is a fake the test advances.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0253 (decisions 2 to 4); ADR 0269 (time is faked in tests).
 */
import { buildConfig } from "@stackra/config";
import type { Clock } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PeripheralsConfig } from "#config/peripherals.config";
import { BarcodeScanner } from "#contracts/ports/barcode-scanner.port";
import { HidBarcodeScannerDriver } from "#electron/drivers/hid-barcode-scanner.driver";

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

/** A scanner on a clock the test advances, with the codes it delivered. */
function setup(): {
  scanner: HidBarcodeScannerDriver;
  codes: string[];
  type: (
    target: InstanceType<typeof electron.EventEmitter>,
    keys: readonly string[],
    gap: number,
  ) => void;
} {
  let now = 1_000_000;
  const clock = { now: () => new Date(now) } as unknown as Clock;
  const scanner = new HidBarcodeScannerDriver(buildConfig(PeripheralsConfig), clock);
  const codes: string[] = [];
  const type = (
    target: InstanceType<typeof electron.EventEmitter>,
    keys: readonly string[],
    gap: number,
  ): void => {
    for (const key of keys) {
      now += gap;
      target.emit(
        "before-input-event",
        {},
        {
          type: "keyDown",
          key,
          isAutoRepeat: false,
          control: false,
          meta: false,
          alt: false,
        },
      );
    }
  };
  return { scanner, codes, type };
}

/** The keys a scanner types for `code`. */
const scan = (code: string): string[] => [...code, "Enter"];

describe("HidBarcodeScannerDriver", () => {
  it("delivers a fast burst ending in Enter, in a window open now or later", async () => {
    const first = webContents();
    electron.windows.splice(0, Infinity, first);
    const { scanner, codes, type } = setup();
    expect(scanner).toBeInstanceOf(BarcodeScanner);
    expect(await scanner.probe()).toEqual({ ok: true, data: undefined });
    const stop = scanner.onScan((code) => codes.push(code));
    await vi.waitFor(() => expect(first.listenerCount("before-input-event")).toBe(1));

    type(first, scan("6281000000012"), 8);
    const later = webContents();
    electron.app.emit("web-contents-created", {}, later);
    type(later, ["Shift", ...scan("AB-12")], 8);
    expect(codes).toEqual(["6281000000012", "AB-12"]);

    stop();
    expect(first.listenerCount("before-input-event")).toBe(0);
    expect(later.listenerCount("before-input-event")).toBe(0);
    expect(electron.app.listenerCount("web-contents-created")).toBe(0);
  });

  it("ignores slow typing, short bursts, held keys and shortcuts", async () => {
    const target = webContents();
    electron.windows.splice(0, Infinity, target);
    const { scanner, codes, type } = setup();
    const stop = scanner.onScan((code) => codes.push(code));
    await vi.waitFor(() => expect(target.listenerCount("before-input-event")).toBe(1));

    type(target, scan("hello"), 120);
    type(target, scan("12"), 8);
    target.emit("before-input-event", {}, { type: "keyDown", key: "a", isAutoRepeat: false });
    for (let held = 0; held < 5; held += 1)
      target.emit("before-input-event", {}, { type: "keyDown", key: "a", isAutoRepeat: true });
    type(target, ["Enter"], 8);
    target.emit(
      "before-input-event",
      {},
      {
        type: "keyDown",
        key: "v",
        isAutoRepeat: false,
        control: true,
      },
    );
    type(target, ["1", "2", "3"], 8);
    target.emit("before-input-event", {}, { type: "keyUp", key: "Enter", isAutoRepeat: false });
    expect(codes).toEqual([]);

    type(target, ["Enter"], 8);
    expect(codes).toEqual(["123"]);
    stop();
  });
});
