/**
 * Stackra file contract:
 * Purpose: `StripeTapToPaySoftPosDriver`, the `SoftPos` driver of Stripe Terminal's Tap to Pay on iPhone and Android:
 *          readiness from the SDK, this phone connected as the reader at a site, the session's payment intent
 *          collected and confirmed on the phone, and a collect cancelled. Stripe's intent status maps onto
 *          `PaymentStatus`; capture, cancel-then-reconcile and the `unknown` state stay on the server's
 *          `PaymentService` over the Stripe Connection (OS integrations).
 * Boundary: the driver named `stripe-tap-to-pay`, bound on the device. It speaks to Stripe only through the
 *           `StripeTerminalBridge` port the Expo staff app binds over the SDK, so this package holds no SDK, no key and
 *           no card data. Which Markets use it is pack data (`payments.softpos`) and the Tap to Pay entitlement per app
 *           bundle is a launch-gate row, both outside this file.
 * Runtime: isomorphic
 * Governing contract: ADR 0446; ADR 0378 (decisions 2 and 5); R3-SO-12; STA-694.
 */
import { Driver } from "@stackra/container";

import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { SoftPos } from "#contracts/ports/soft-pos.port";
import type { StripeTerminalBridge } from "#contracts/ports/stripe-terminal-bridge.port";
import type { SoftPosReadiness } from "#contracts/types/soft-pos-readiness.type";
import type { TerminalSession } from "#contracts/types/terminal-session.type";
import { PaymentDeclinedError } from "#core/errors/payment-declined.error";
import { PaymentFieldRequiredError } from "#core/errors/payment-field-required.error";
import { SoftPosUnavailableError } from "#core/errors/soft-pos-unavailable.error";

/** The provider code of the Stripe Connection that serves the session. */
const PROVIDER = "stripe";

/** Stripe intent status to the engine's state; any other status is still pending at Stripe. */
const STATUS: Readonly<Record<string, PaymentStatus>> = {
  requires_capture: PaymentStatus.Authorized,
  succeeded: PaymentStatus.Captured,
  canceled: PaymentStatus.Voided,
  requires_payment_method: PaymentStatus.Failed,
};

/**
 * Tap to Pay through Stripe Terminal.
 *
 * @example
 * await softPos.connect(settings.payments.stripeLocation); // a till setting
 * const read = await softPos.collect(session);
 */
export class StripeTapToPaySoftPosDriver extends Driver(SoftPos) {
  /** The SDK, as the app wraps it. */
  private readonly bridge: StripeTerminalBridge;

  /**
   * @param bridge - the staff app's binding over Stripe Terminal's mobile SDK.
   */
  constructor(bridge: StripeTerminalBridge) {
    super();
    this.bridge = bridge;
  }

  /** Not ready on an unsupported phone or before `connect`; the SDK's error code otherwise. */
  async readiness(): Promise<SoftPosReadiness> {
    const support = await this.bridge.supportsTapToPay();
    if (support.error !== undefined) return { ready: false, reason: support.error.code };
    if (support.supported !== true) return { ready: false, reason: "unsupported_device" };
    return (await this.bridge.connected())
      ? { ready: true }
      : { ready: false, reason: "not_connected" };
  }

  /**
   * Connects this phone as the Tap to Pay reader at `location` (a Stripe location id).
   *
   * @throws SoftPosUnavailableError when the phone is unsupported or the SDK refuses.
   */
  async connect(location: string): Promise<void> {
    const support = await this.bridge.supportsTapToPay();
    if (support.error !== undefined || support.supported !== true)
      throw SoftPosUnavailableError.create({
        provider: PROVIDER,
        reason: support.error?.code ?? "unsupported_device",
      });
    const { error } = await this.bridge.connectTapToPay(location);
    if (error !== undefined)
      throw SoftPosUnavailableError.create({ provider: PROVIDER, reason: error.code });
  }

  /**
   * Collects and confirms the session's intent on the phone.
   *
   * @throws PaymentFieldRequiredError when the session carries no `clientSecret`.
   * @throws PaymentDeclinedError when the SDK answers with an error (a decline or a cancel).
   */
  async collect(session: TerminalSession): Promise<TerminalSession> {
    if (session.clientSecret === undefined || session.clientSecret === "")
      throw PaymentFieldRequiredError.create({ provider: PROVIDER, field: "clientSecret" });
    const { paymentIntent, error } = await this.bridge.collectAndConfirm(session.clientSecret);
    if (error !== undefined || paymentIntent === undefined)
      throw PaymentDeclinedError.create({
        provider: PROVIDER,
        ...(error === undefined ? {} : { providerCode: error.code }),
      });
    return {
      ...session,
      providerRef: paymentIntent.id,
      status: STATUS[paymentIntent.status] ?? PaymentStatus.Pending,
    };
  }

  /** Cancels a collect in progress; an SDK error (nothing to cancel) is ignored, the server reconciles. */
  async cancel(): Promise<void> {
    await this.bridge.cancelCollect();
  }
}
