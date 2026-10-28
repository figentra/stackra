/**
 * Stackra file contract:
 * Purpose: proves `listenScaleLines` joins chunks into lines on the terminator, drops empty lines and chunks that are
 *          not text, resets an overlong partial line, does nothing without the module, and stops on the returned
 *          function.
 * Boundary: test only; drives the stand-in `StackraNativeScale` of `SCALE_SDK`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0478 (decision 5).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SCALE_SDK } from "#core/__tests__/scale-sdk.fixture";
import { listenScaleLines } from "#core/functions/listen-scale-lines.function";

describe("listenScaleLines", () => {
  afterEach(SCALE_SDK.uninstall);

  it("hands on whole lines across chunks until stopped", () => {
    const device = SCALE_SDK.install();
    const listener = vi.fn();
    const stop = listenScaleLines(device, "\r\n", listener);
    device.emit({ text: "S S   1.2" });
    device.emit({ text: "50 kg\r\n\r\nS D" });
    device.emit({ text: 42 });
    device.emit({ text: "   1.1 kg\r\n" });
    expect(listener.mock.calls).toEqual([["S S   1.250 kg"], ["S D   1.1 kg"]]);
    stop();
    device.emit({ text: "S S 1 g\r\n" });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(device.remove).toHaveBeenCalledTimes(1);
  });

  it("drops a partial line longer than 1 KiB", () => {
    const device = SCALE_SDK.install();
    const listener = vi.fn();
    listenScaleLines(device, "\r\n", listener);
    device.emit({ text: "x".repeat(1100) });
    device.emit({ text: "ST,+00001.00  g\r\n" });
    expect(listener.mock.calls).toEqual([["ST,+00001.00  g"]]);
  });

  it("does nothing without the module", () => {
    const stop = listenScaleLines(undefined, "\r\n", vi.fn());
    expect(() => stop()).not.toThrow();
  });
});
