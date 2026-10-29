/**
 * Stackra file contract:
 * Purpose: proves `ContinuousAsciiScaleDriver` refuses on capability `serial` without the module, an address, a line
 *          or a usable weight (overload); reads the next streamed weight, after the pack's request command when one is
 *          configured; builds the frame with gross or net and a sent tare; and streams every weight to listeners
 *          until stopped.
 * Boundary: test only; replays the transcribed A&D standard format lines of `SCALE_SDK` through a stand-in
 *           `StackraNativeScale`. Never a legal-for-trade reading: those come from a certified scale only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0478 (decision 5); ADR 0253; ADR 0250 (decision 3).
 */
import { buildConfig } from "@stackra/config";
import { Duration } from "@stackra/contracts";
import { MemoryDevicePermissionsDriver } from "@stackra/platform";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { NativeScaleConfig } from "#config/native-scale.config";
import { SCALE_SDK } from "#core/__tests__/scale-sdk.fixture";
import { NATIVE_SCALE_CONFIG_SCHEMA } from "#core/constants/native-scale-config-schema.constant";
import { ContinuousAsciiScaleDriver } from "#core/drivers/continuous-ascii-scale.driver";
import { ScaleProtocolName } from "#core/enums/scale-protocol-name.enum";

const UNAVAILABLE = { ok: false, error: { code: "unavailable", capability: "serial" } };

/** A USB scale with a short read timeout, optionally in command mode (`Q`). */
function scale(request = ""): ContinuousAsciiScaleDriver {
  const protocols = NATIVE_SCALE_CONFIG_SCHEMA.parse({}).protocols;
  return new ContinuousAsciiScaleDriver(
    buildConfig(NativeScaleConfig, {
      values: {
        protocol: ScaleProtocolName.ContinuousAscii,
        transport: "usb",
        address: "0403:6001",
        readTimeout: Duration.seconds(0.05),
        protocols: { ...protocols, continuous_ascii: { ...protocols.continuous_ascii, request } },
      },
    }),
    new MemoryDevicePermissionsDriver(),
  );
}

describe("ContinuousAsciiScaleDriver", () => {
  afterEach(SCALE_SDK.uninstall);

  it("refuses without the module or a line", async () => {
    expect(await scale().probe()).toEqual(UNAVAILABLE);
    expect(await scale().read()).toEqual(UNAVAILABLE);
    SCALE_SDK.install();
    expect(await scale().read()).toEqual(UNAVAILABLE);
  });

  it("reads the next streamed weight and refuses an overload", async () => {
    const device = SCALE_SDK.install({ isConnected: true });
    const driver = scale();
    const pending = driver.read();
    await vi.waitFor(() => expect(device.addListener).toHaveBeenCalledTimes(1));
    device.emit({ text: `${SCALE_SDK.continuous.counting}\r\n${SCALE_SDK.continuous.moving}\r\n` });
    expect(await pending).toEqual({ ok: true, data: { grams: 248.1, isStable: false } });
    expect(device.write).not.toHaveBeenCalled();
    const overload = driver.read();
    await vi.waitFor(() => expect(device.addListener).toHaveBeenCalledTimes(2));
    device.emit({ text: `${SCALE_SDK.continuous.overload}\r\n` });
    expect(await overload).toEqual(UNAVAILABLE);
  });

  it("sends the configured request command", async () => {
    const device = SCALE_SDK.install({ replies: { Q: [SCALE_SDK.continuous.stableGrams] } });
    expect(await scale("Q").read()).toEqual({ ok: true, data: { grams: 250, isStable: true } });
    expect(device.write.mock.calls).toEqual([["Q\r\n"]]);
  });

  it("builds the frame with net or gross and a sent tare", async () => {
    const device = SCALE_SDK.install({ isConnected: true });
    const driver = scale();
    const pending = driver.frame();
    await vi.waitFor(() => expect(device.addListener).toHaveBeenCalledTimes(1));
    device.emit({
      text: `${SCALE_SDK.continuous.tare}\r\n${SCALE_SDK.continuous.stableNetKg}\r\n`,
    });
    expect(await pending).toEqual({
      ok: true,
      data: { grams: 1250, value: 1.25, unit: "kg", isStable: true, isNet: true, tareGrams: 150 },
    });
  });

  it("streams every weight until stopped", async () => {
    const device = SCALE_SDK.install();
    const listener = vi.fn();
    const stop = scale().onWeight(listener);
    await vi.waitFor(() => expect(device.connect).toHaveBeenCalledTimes(1));
    device.emit({
      text: `${SCALE_SDK.continuous.moving}\r\n${SCALE_SDK.continuous.counting}\r\n${SCALE_SDK.continuous.stableGrams}\r\n`,
    });
    expect(listener.mock.calls).toEqual([
      [{ grams: 248.1, isStable: false }],
      [{ grams: 250, isStable: true }],
    ]);
    stop();
    device.emit({ text: `${SCALE_SDK.continuous.stableGrams}\r\n` });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(device.write).not.toHaveBeenCalled();
  });
});
