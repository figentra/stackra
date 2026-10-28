/**
 * Stackra file contract:
 * Purpose: proves `NativeStripeTerminalBridgeDriver` answers @stackra/payments' `StripeTerminalBridge` like the SDK:
 *          Tap to Pay support and connect, `connected` only for this phone as the reader, collect and confirm with the
 *          intent status in Stripe's API spelling, cancel, errors passed through, and `module_unavailable` without the
 *          module.
 * Boundary: test only; replays the recorded SDK answers through the stand-in `StackraCardTerminal` module.
 * Runtime: node (vitest)
 * Governing contract: ADR 0479 (decisions 3 to 5); ADR 0446 (decision 4); ADR 0022 (test placement).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";

import { NativeStripeTerminalBridgeDriver } from "#native/drivers/native-stripe-terminal-bridge.driver";
import { CARD_TERMINAL_SDK } from "#native/__tests__/card-terminal-sdk.fixture";
import { StandInServer } from "#native/__tests__/stand-in-server.fixture";

const UNAVAILABLE = { error: { code: "module_unavailable" } };

describe("NativeStripeTerminalBridgeDriver", () => {
  afterEach(CARD_TERMINAL_SDK.uninstall);

  it("answers module_unavailable without the module", async () => {
    const bridge = new NativeStripeTerminalBridgeDriver(new StandInServer());
    expect(await bridge.supportsTapToPay()).toEqual(UNAVAILABLE);
    expect(await bridge.connectTapToPay("tml_1")).toEqual(UNAVAILABLE);
    expect(await bridge.collectAndConfirm("pi_1_secret_2")).toEqual(UNAVAILABLE);
    expect(await bridge.cancelCollect()).toEqual(UNAVAILABLE);
    expect(await bridge.connected()).toBe(false);
  });

  it("connects this phone as the reader and reports it connected", async () => {
    const module = CARD_TERMINAL_SDK.install();
    const bridge = new NativeStripeTerminalBridgeDriver(new StandInServer());
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

  it("passes a connect error through", async () => {
    CARD_TERMINAL_SDK.install({
      connectTapToPay: async () => ({ error: CARD_TERMINAL_SDK.error.androidLocationOff }),
    });
    expect(
      await new NativeStripeTerminalBridgeDriver(new StandInServer()).connectTapToPay("tml_1"),
    ).toEqual({ error: CARD_TERMINAL_SDK.error.androidLocationOff });
  });

  it("collects and confirms the server's intent with the status in Stripe's API spelling", async () => {
    const module = CARD_TERMINAL_SDK.install();
    const bridge = new NativeStripeTerminalBridgeDriver(new StandInServer());
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
    const bridge = new NativeStripeTerminalBridgeDriver(new StandInServer());
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
    const bridge = new NativeStripeTerminalBridgeDriver(new StandInServer());
    await bridge.supportsTapToPay();
    await bridge.supportsTapToPay();
    expect(module.addListener).toHaveBeenCalledTimes(1);
  });
});
