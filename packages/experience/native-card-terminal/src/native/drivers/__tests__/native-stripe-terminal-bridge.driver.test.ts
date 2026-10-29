/**
 * Stackra file contract:
 * Purpose: proves `NativeStripeTerminalBridgeDriver` answers @stackra/payments' `StripeTerminalBridge` like the SDK:
 *          Tap to Pay support and connect, `connected` only for this phone as the reader, collect and confirm with the
 *          intent status in Stripe's API spelling, cancel, errors passed through, `module_unavailable` without the
 *          module, and `location_permission_denied` when `SystemPermissions` denies or blocks location for Tap to Pay.
 * Boundary: test only; replays the recorded SDK answers through the stand-in `StackraCardTerminal` module.
 * Runtime: node (vitest)
 * Governing contract: ADR 0479 (decisions 3 to 5); ADR 0446 (decision 4); ADR 0022 (test placement).
 */
import { MemorySystemPermissionsDriver } from "@stackra/platform";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { NativeStripeTerminalBridgeDriver } from "#native/drivers/native-stripe-terminal-bridge.driver";
import { CARD_TERMINAL_SDK } from "#native/__tests__/card-terminal-sdk.fixture";
import { StandInServer } from "#native/__tests__/stand-in-server.fixture";

const UNAVAILABLE = { error: { code: "module_unavailable" } };

/** A permissions driver whose prompt rejects, as the Expo one does with no attached Activity. */
class RejectingPermissions extends MemorySystemPermissionsDriver {
  /** Rejects like a failed OS prompt. */
  override async request(): Promise<never> {
    throw new Error("no attached Activity");
  }
}

describe("NativeStripeTerminalBridgeDriver", () => {
  afterEach(CARD_TERMINAL_SDK.uninstall);

  it("answers module_unavailable without the module", async () => {
    const bridge = new NativeStripeTerminalBridgeDriver(
      new StandInServer(),
      new MemorySystemPermissionsDriver(),
    );
    expect(await bridge.supportsTapToPay()).toEqual(UNAVAILABLE);
    expect(await bridge.connectTapToPay("tml_1")).toEqual(UNAVAILABLE);
    expect(await bridge.collectAndConfirm("pi_1_secret_2")).toEqual(UNAVAILABLE);
    expect(await bridge.cancelCollect()).toEqual(UNAVAILABLE);
    expect(await bridge.connected()).toBe(false);
  });

  it("connects this phone as the reader and reports it connected", async () => {
    const module = CARD_TERMINAL_SDK.install();
    const bridge = new NativeStripeTerminalBridgeDriver(
      new StandInServer(),
      new MemorySystemPermissionsDriver(),
    );
    expect(await bridge.supportsTapToPay()).toEqual({ supported: true });
    expect(await bridge.connected()).toBe(false);
    expect(await bridge.connectTapToPay("tml_1")).toEqual({});
    expect(module.connectTapToPay).toHaveBeenCalledWith("tml_1");
    expect(await bridge.connected()).toBe(true);
    module.setConnected(CARD_TERMINAL_SDK.reader.androidTapToPay);
    expect(await bridge.connected()).toBe(true);
    module.setConnected(CARD_TERMINAL_SDK.reader.iosM2);
    expect(await bridge.connected()).toBe(false);
  });

  it("asks SystemPermissions for location before Tap to Pay and refuses when it is denied or blocked", async () => {
    for (const status of ["denied", "blocked"] as const) {
      const module = CARD_TERMINAL_SDK.install();
      const permissions = new MemorySystemPermissionsDriver();
      permissions.requestAnswer = status;
      expect(
        await new NativeStripeTerminalBridgeDriver(
          new StandInServer(),
          permissions,
        ).connectTapToPay("tml_1"),
      ).toEqual({ error: { code: "location_permission_denied" } });
      expect(permissions.statuses.location).toBe(status);
      expect(module.connectTapToPay).not.toHaveBeenCalled();
    }
  });

  it("passes a connect error through", async () => {
    CARD_TERMINAL_SDK.install({
      connectTapToPay: async () => ({ error: CARD_TERMINAL_SDK.error.androidLocationOff }),
    });
    expect(
      await new NativeStripeTerminalBridgeDriver(
        new StandInServer(),
        new MemorySystemPermissionsDriver(),
      ).connectTapToPay("tml_1"),
    ).toEqual({ error: CARD_TERMINAL_SDK.error.androidLocationOff });
  });

  it("collects and confirms the server's intent with the status in Stripe's API spelling", async () => {
    const module = CARD_TERMINAL_SDK.install();
    const bridge = new NativeStripeTerminalBridgeDriver(
      new StandInServer(),
      new MemorySystemPermissionsDriver(),
    );
    expect(await bridge.collectAndConfirm("pi_3QxTest_secret_abc")).toEqual({
      paymentIntent: { id: "pi_3QxTest", status: "requires_capture" },
    });
    expect(module.collectAndConfirm).toHaveBeenCalledWith("pi_3QxTest_secret_abc");
    module.collectAndConfirm.mockResolvedValueOnce({
      paymentIntent: { id: "pi_2", status: "SUCCEEDED" },
    });
    expect(await bridge.collectAndConfirm("pi_2_secret_x")).toEqual({
      paymentIntent: { id: "pi_2", status: "succeeded" },
    });
  });

  it("passes a decline and a cancel through as errors", async () => {
    const module = CARD_TERMINAL_SDK.install();
    const bridge = new NativeStripeTerminalBridgeDriver(
      new StandInServer(),
      new MemorySystemPermissionsDriver(),
    );
    module.collectAndConfirm.mockResolvedValueOnce({ error: CARD_TERMINAL_SDK.error.iosDeclined });
    expect(await bridge.collectAndConfirm("pi_1_secret_2")).toEqual({
      error: CARD_TERMINAL_SDK.error.iosDeclined,
    });
    module.cancelCollect.mockResolvedValueOnce({ error: CARD_TERMINAL_SDK.error.androidCanceled });
    expect(await bridge.cancelCollect()).toEqual({
      error: CARD_TERMINAL_SDK.error.androidCanceled,
    });
    expect(await bridge.cancelCollect()).toEqual({});
  });

  it("shares one token relay with the card terminal driver", async () => {
    const module = CARD_TERMINAL_SDK.install();
    const bridge = new NativeStripeTerminalBridgeDriver(
      new StandInServer(),
      new MemorySystemPermissionsDriver(),
    );
    await bridge.supportsTapToPay();
    await bridge.supportsTapToPay();
    expect(module.addListener).toHaveBeenCalledTimes(1);
  });
  it("reads a rejected location prompt as location_permission_denied", async () => {
    const module = CARD_TERMINAL_SDK.install();
    expect(
      await new NativeStripeTerminalBridgeDriver(
        new StandInServer(),
        new RejectingPermissions(),
      ).connectTapToPay("tml_1"),
    ).toEqual({ error: { code: "location_permission_denied" } });
    expect(module.connectTapToPay).not.toHaveBeenCalled();
  });
});
