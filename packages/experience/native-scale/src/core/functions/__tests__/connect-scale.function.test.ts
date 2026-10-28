/**
 * Stackra file contract:
 * Purpose: proves `connectScale` refuses `unavailable` without the module or an address, opens the configured link
 *          once (all six link fields), reuses an open link, and maps a rejected connect to `permission_denied` or
 *          `unavailable` by its code.
 * Boundary: test only; drives the stand-in `StackraNativeScale` of `SCALE_SDK`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0478 (decision 5); ADR 0250 (decision 3).
 */
import { buildConfig } from "@stackra/config";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { NativeScaleConfig } from "#config/native-scale.config";
import { SCALE_SDK } from "#core/__tests__/scale-sdk.fixture";
import { connectScale } from "#core/functions/connect-scale.function";

const UNAVAILABLE = { ok: false, error: { code: "unavailable", capability: "serial" } };

describe("connectScale", () => {
  afterEach(SCALE_SDK.uninstall);

  const config = buildConfig(NativeScaleConfig, {
    values: { transport: "spp", address: "00:11:22:33:44:55" },
  });

  it("refuses without the module or an address", async () => {
    expect(await connectScale(config)).toEqual(UNAVAILABLE);
    SCALE_SDK.install();
    expect(await connectScale(buildConfig(NativeScaleConfig))).toEqual(UNAVAILABLE);
  });

  it("opens the configured link once", async () => {
    const device = SCALE_SDK.install();
    expect(await connectScale(config)).toEqual({ ok: true, data: device });
    expect(await connectScale(config)).toEqual({ ok: true, data: device });
    expect(device.connect.mock.calls).toEqual([
      [
        {
          transport: "spp",
          address: "00:11:22:33:44:55",
          baudRate: 9600,
          bleService: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
          bleNotify: "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
          bleWrite: "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
        },
      ],
    ]);
  });

  it("maps a rejected connect by its code", async () => {
    SCALE_SDK.install({ connectError: "E_PERMISSION" });
    expect(await connectScale(config)).toEqual({
      ok: false,
      error: { code: "permission_denied", capability: "serial" },
    });
    SCALE_SDK.install({ connectError: "E_UNAVAILABLE" });
    expect(await connectScale(config)).toEqual(UNAVAILABLE);
  });
});
