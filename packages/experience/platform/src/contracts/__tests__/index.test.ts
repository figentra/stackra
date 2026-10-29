/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: it exports the three ports (`CaptchaVerifier`,
 *          `Platform`, `PlatformPushTransport`, which the generated wiring imports) and the types their signatures name.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias. Type exports are checked by type.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); registry A3 (`Platform` here only).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type {
  CapabilityRefusal,
  CapabilityResult,
  PermissionStatus,
  PushRegistration,
  ReadonlySignal,
  SharedPayload,
} from "#contracts/index";

describe("@stackra/platform/contracts", () => {
  it("exports exactly the eight ports at run time", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "AppLock",
      "CaptchaVerifier",
      "DevicePermissions",
      "KioskMode",
      "Platform",
      "PlatformPushTransport",
      "SecondScreen",
      "SystemSettings",
    ]);
  });

  it("types a capability result as a refusal or data", () => {
    expectTypeOf<CapabilityRefusal["code"]>().toEqualTypeOf<"unavailable" | "permission_denied">();
    expectTypeOf<Extract<CapabilityResult<number>, { ok: true }>["data"]>().toEqualTypeOf<number>();
    expectTypeOf<
      Extract<CapabilityResult, { ok: false }>["error"]
    >().toEqualTypeOf<CapabilityRefusal>();
  });

  it("spells permissions as the Permissions API does", () => {
    expectTypeOf<PermissionStatus>().toEqualTypeOf<"granted" | "denied" | "prompt">();
  });

  it("types the payload, registration and signal shapes", () => {
    expectTypeOf<SharedPayload["files"]>().toEqualTypeOf<readonly File[]>();
    expectTypeOf<PushRegistration>().toEqualTypeOf<{
      readonly provider: string;
      readonly token: string;
    }>();
    expectTypeOf<ReadonlySignal<boolean>>().toHaveProperty("subscribe");
    expectTypeOf<ReadonlySignal<boolean>>().not.toHaveProperty("set");
  });
});
