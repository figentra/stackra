/**
 * Stackra file contract:
 * Purpose: proves `MtSicsScaleDriver` refuses on capability `serial` without the module, an address, an answer or a
 *          usable weight (overload, underload, busy) and with `permission_denied` on a refused permission; reads
 *          settled and moving weights with `SI`; builds the full frame with the tare from `TA`; and streams with `SIR`
 *          for the first listener, `@` after the last, reading from the stream instead of cancelling it.
 * Boundary: test only; replays the transcribed MT-SICS lines of `SCALE_SDK` through a stand-in `StackraNativeScale`.
 *           Never a legal-for-trade reading: those come from a certified scale only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0478 (decision 5); ADR 0253; ADR 0250 (decision 3).
 */
import { buildConfig } from "@stackra/config";
import { Duration } from "@stackra/contracts";
import { MemorySystemPermissionsDriver } from "@stackra/platform";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { NativeScaleConfig } from "#config/native-scale.config";
import { SCALE_SDK } from "#core/__tests__/scale-sdk.fixture";
import { MtSicsScaleDriver } from "#core/drivers/mt-sics-scale.driver";

const UNAVAILABLE = { ok: false, error: { code: "unavailable", capability: "serial" } };

/** A scale on a BLE address with a short read timeout. */
function scale(): MtSicsScaleDriver {
  return new MtSicsScaleDriver(
    buildConfig(NativeScaleConfig, {
      values: {
        address: "0d6b3a2e-6c0b-4b9e-9a51-6f1b2c3d4e5f",
        readTimeout: Duration.seconds(0.05),
      },
    }),
    new MemorySystemPermissionsDriver(),
  );
}

describe("MtSicsScaleDriver", () => {
  afterEach(SCALE_SDK.uninstall);

  it("refuses without the module or an address", async () => {
    expect(await scale().probe()).toEqual(UNAVAILABLE);
    expect(await scale().read()).toEqual(UNAVAILABLE);
    expect(await scale().frame()).toEqual(UNAVAILABLE);
    SCALE_SDK.install();
    expect(
      await new MtSicsScaleDriver(
        buildConfig(NativeScaleConfig),
        new MemorySystemPermissionsDriver(),
      ).probe(),
    ).toEqual(UNAVAILABLE);
  });

  it("refuses with permission_denied when the module lacks the permission", async () => {
    SCALE_SDK.install({ connectError: "E_PERMISSION" });
    expect(await scale().read()).toEqual({
      ok: false,
      error: { code: "permission_denied", capability: "serial" },
    });
  });

  it("reads settled and moving weights with SI", async () => {
    const device = SCALE_SDK.install({ replies: { SI: [SCALE_SDK.mtSics.stableKg] } });
    const driver = scale();
    expect(await driver.probe()).toEqual({ ok: true, data: undefined });
    expect(await driver.read()).toEqual({ ok: true, data: { grams: 1250, isStable: true } });
    expect(device.write.mock.calls).toEqual([["SI\r\n"]]);
    SCALE_SDK.install({ isConnected: true, replies: { SI: [SCALE_SDK.mtSics.movingKg] } });
    expect(await driver.read()).toEqual({ ok: true, data: { grams: 1180, isStable: false } });
  });

  it("refuses an overload, an underload, a busy scale and no answer", async () => {
    for (const fault of [
      SCALE_SDK.mtSics.overload,
      SCALE_SDK.mtSics.underload,
      SCALE_SDK.mtSics.busy,
      SCALE_SDK.mtSics.syntaxError,
    ]) {
      SCALE_SDK.install({ replies: { SI: [fault] } });
      expect(await scale().read()).toEqual(UNAVAILABLE);
    }
    SCALE_SDK.install();
    expect(await scale().read()).toEqual(UNAVAILABLE);
  });

  it("builds the full frame with the tare", async () => {
    const device = SCALE_SDK.install({
      replies: { TA: [SCALE_SDK.mtSics.tareKg], SI: [SCALE_SDK.mtSics.stableKg] },
    });
    expect(await scale().frame()).toEqual({
      ok: true,
      data: { grams: 1250, value: 1.25, unit: "kg", isStable: true, isNet: true, tareGrams: 150 },
    });
    expect(device.write.mock.calls).toEqual([["TA\r\n"], ["SI\r\n"]]);
    SCALE_SDK.install({
      replies: { TA: [SCALE_SDK.mtSics.noTare], SI: [SCALE_SDK.mtSics.stableGrams] },
    });
    expect(await scale().frame()).toMatchObject({ ok: true, data: { isNet: false, tareGrams: 0 } });
  });

  it("streams with SIR for the first listener and @ after the last", async () => {
    const device = SCALE_SDK.install();
    const driver = scale();
    const first = vi.fn();
    const second = vi.fn();
    const stopFirst = driver.onWeight(first);
    const stopSecond = driver.onWeight(second);
    await vi.waitFor(() => expect(device.write.mock.calls).toEqual([["SIR\r\n"]]));
    device.emit({ text: `${SCALE_SDK.mtSics.movingKg}\r\n${SCALE_SDK.mtSics.overload}\r\n` });
    expect(first.mock.calls).toEqual([[{ grams: 1180, isStable: false }]]);
    expect(second.mock.calls).toEqual([[{ grams: 1180, isStable: false }]]);
    const pending = driver.read();
    await vi.waitFor(() => expect(device.addListener).toHaveBeenCalledTimes(3));
    device.emit({ text: `${SCALE_SDK.mtSics.stableKg}\r\n` });
    expect(await pending).toEqual({ ok: true, data: { grams: 1250, isStable: true } });
    stopFirst();
    stopFirst();
    stopSecond();
    await vi.waitFor(() => expect(device.write.mock.calls).toEqual([["SIR\r\n"], ["@\r\n"]]));
  });
});
