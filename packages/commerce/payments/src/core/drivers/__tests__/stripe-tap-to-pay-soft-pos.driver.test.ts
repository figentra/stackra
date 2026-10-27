/**
 * Stackra file contract:
 * Purpose: unit tests of `StripeTapToPaySoftPosDriver`: readiness follows the SDK's support and connection, connect
 *          refuses an unsupported phone or an SDK error, collect needs the session's client secret, maps Stripe's
 *          intent status onto `PaymentStatus` and turns an SDK error into a decline, and cancel asks the SDK.
 * Boundary: test only; a scripted bridge stands in for the staff app's binding over the SDK.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0446; ADR 0378 (decision 2).
 */
import { refusal } from "@stackra/errors/testing";
import { describe, expect, it } from "@stackra/testing";

import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { StripeTerminalBridge } from "#contracts/ports/stripe-terminal-bridge.port";
import type { StripeBridgeError } from "#contracts/types/stripe-bridge-error.type";
import type { StripeBridgeIntent } from "#contracts/types/stripe-bridge-intent.type";
import { StripeTapToPaySoftPosDriver } from "#core/drivers/stripe-tap-to-pay-soft-pos.driver";
import { PaymentDeclinedError } from "#core/errors/payment-declined.error";
import { PaymentFieldRequiredError } from "#core/errors/payment-field-required.error";
import { SoftPosUnavailableError } from "#core/errors/soft-pos-unavailable.error";

/** A bridge whose answers a test sets. */
class ScriptedBridge extends StripeTerminalBridge {
  supported: { supported?: boolean; error?: StripeBridgeError } = { supported: true };

  connectError: StripeBridgeError | undefined;

  location: string | undefined;

  collected: { paymentIntent?: StripeBridgeIntent; error?: StripeBridgeError } = {};

  secrets: string[] = [];

  cancels = 0;

  async supportsTapToPay(): Promise<{ supported?: boolean; error?: StripeBridgeError }> {
    return this.supported;
  }

  async connectTapToPay(locationId: string): Promise<{ error?: StripeBridgeError }> {
    if (this.connectError !== undefined) return { error: this.connectError };
    this.location = locationId;
    return {};
  }

  async connected(): Promise<boolean> {
    return this.location !== undefined;
  }

  async collectAndConfirm(
    clientSecret: string,
  ): Promise<{ paymentIntent?: StripeBridgeIntent; error?: StripeBridgeError }> {
    this.secrets.push(clientSecret);
    return this.collected;
  }

  async cancelCollect(): Promise<{ error?: StripeBridgeError }> {
    this.cancels += 1;
    return {};
  }
}

const session = {
  providerRef: "pi_1",
  terminalId: "tmr_phone",
  status: PaymentStatus.Pending,
  clientSecret: "pi_1_secret_x",
};

describe("StripeTapToPaySoftPosDriver", () => {
  it("is ready only on a supported, connected phone", async () => {
    const bridge = new ScriptedBridge();
    const softPos = new StripeTapToPaySoftPosDriver(bridge);
    expect(await softPos.readiness()).toEqual({ ready: false, reason: "not_connected" });
    await softPos.connect("tml_loc_1");
    expect(bridge.location).toBe("tml_loc_1");
    expect(await softPos.readiness()).toEqual({ ready: true });
    bridge.supported = { supported: false };
    expect(await softPos.readiness()).toEqual({ ready: false, reason: "unsupported_device" });
    bridge.supported = { error: { code: "TapToPayUnsupportedOSVersion" } };
    expect(await softPos.readiness()).toEqual({
      ready: false,
      reason: "TapToPayUnsupportedOSVersion",
    });
  });

  it("refuses to connect an unsupported phone or when the SDK refuses", async () => {
    const bridge = new ScriptedBridge();
    const softPos = new StripeTapToPaySoftPosDriver(bridge);
    bridge.supported = { supported: false };
    await expect(softPos.connect("tml_loc_1")).rejects.toRefuseWith(
      refusal(SoftPosUnavailableError, { provider: "stripe", reason: "unsupported_device" }),
    );
    bridge.supported = { supported: true };
    bridge.connectError = { code: "TapToPayReaderTOSAcceptanceRequired" };
    await expect(softPos.connect("tml_loc_1")).rejects.toRefuseWith(
      refusal(SoftPosUnavailableError, {
        provider: "stripe",
        reason: "TapToPayReaderTOSAcceptanceRequired",
      }),
    );
  });

  it("collects with the client secret and maps the intent status", async () => {
    const bridge = new ScriptedBridge();
    const softPos = new StripeTapToPaySoftPosDriver(bridge);
    bridge.collected = { paymentIntent: { id: "pi_1", status: "requires_capture" } };
    expect(await softPos.collect(session)).toEqual({
      ...session,
      status: PaymentStatus.Authorized,
    });
    expect(bridge.secrets).toEqual(["pi_1_secret_x"]);
    bridge.collected = { paymentIntent: { id: "pi_1", status: "succeeded" } };
    expect((await softPos.collect(session)).status).toBe(PaymentStatus.Captured);
    bridge.collected = { paymentIntent: { id: "pi_1", status: "processing" } };
    expect((await softPos.collect(session)).status).toBe(PaymentStatus.Pending);
  });

  it("needs a client secret and turns an SDK error into a decline", async () => {
    const bridge = new ScriptedBridge();
    const softPos = new StripeTapToPaySoftPosDriver(bridge);
    const { clientSecret: _secret, ...bare } = session;
    await expect(softPos.collect(bare)).rejects.toRefuseWith(
      refusal(PaymentFieldRequiredError, { provider: "stripe", field: "clientSecret" }),
    );
    bridge.collected = { error: { code: "Canceled" } };
    await expect(softPos.collect(session)).rejects.toRefuseWith(
      refusal(PaymentDeclinedError, { provider: "stripe", providerCode: "Canceled" }),
    );
  });

  it("cancels a collect through the SDK", async () => {
    const bridge = new ScriptedBridge();
    await new StripeTapToPaySoftPosDriver(bridge).cancel();
    expect(bridge.cancels).toBe(1);
  });
});
