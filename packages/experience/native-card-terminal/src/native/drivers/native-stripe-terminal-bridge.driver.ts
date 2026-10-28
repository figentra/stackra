/**
 * Stackra file contract:
 * Purpose: `NativeStripeTerminalBridgeDriver`, the `StripeTerminalBridge` driver of @stackra/payments over the
 *          `StackraCardTerminal` Expo module (`native`): the calls the `stripe-tap-to-pay` SoftPos driver makes, Tap to
 *          Pay support, this phone connected as the reader, collect and confirm of a server-created intent, cancel.
 * Boundary: answers like the SDK, with `error` instead of a throw. Shares the module, and so the SDK instance and the
 *           connected reader, with `StripeTerminalCardTerminalDriver`. Normalises the SDK's intent status to Stripe's
 *           API name (`requires_capture`) so the SoftPos driver's status table reads it. Creates no intent, never runs
 *           offline, holds no key (ADR 0479 decisions 4 and 5). Without the module every call answers
 *           `module_unavailable`. Certification pending (STA-739).
 * Runtime: isomorphic
 * Governing contract: ADR 0479 (decisions 3 to 5); ADR 0446 (decision 4, as ADR 0479 amends it); ADR 0478 (decision 5).
 */
import { Driver } from "@stackra/container";
import { StripeTerminalBridge } from "@stackra/payments/contracts";
import type { StripeBridgeError, StripeBridgeIntent } from "@stackra/payments/contracts";

import type { StripeTerminalServer } from "#contracts/ports/stripe-terminal-server.port";
import { STRIPE_TERMINAL } from "#native/constants/stripe-terminal.constant";
import { cardTerminalModule } from "#native/functions/card-terminal-module.function";
import { prepareCardTerminal } from "#native/functions/prepare-card-terminal.function";
import { sdkName } from "#native/functions/sdk-name.function";

/** The answer of every call when the module is not linked or the SDK would not start. */
const UNAVAILABLE: { readonly error: StripeBridgeError } = Object.freeze({
  error: Object.freeze({ code: "module_unavailable" }),
});

/**
 * Stripe Terminal's mobile SDK, through this package's Expo module.
 *
 * @example
 * // generated native wiring of the staff app
 * { port: StripeTerminalBridge, candidates: { native: () => import("@stackra/native-card-terminal/native").then((m) => m.NativeStripeTerminalBridgeDriver) } }
 * const softPos = new StripeTapToPaySoftPosDriver(bridge); // @stackra/payments
 */
export class NativeStripeTerminalBridgeDriver extends Driver(StripeTerminalBridge) {
  /** The server that mints connection tokens. */
  private readonly server: StripeTerminalServer;

  /**
   * @param server - the host's binding over its Stripe Terminal server actions.
   */
  constructor(server: StripeTerminalServer) {
    super();
    this.server = server;
  }

  /** Whether this phone supports Tap to Pay. */
  async supportsTapToPay(): Promise<{
    readonly supported?: boolean;
    readonly error?: StripeBridgeError;
  }> {
    const module = await prepareCardTerminal(this.server);
    return module === undefined ? UNAVAILABLE : module.supportsTapToPay();
  }

  /** Discovers this phone as a Tap to Pay reader and connects it at `locationId`. */
  async connectTapToPay(locationId: string): Promise<{ readonly error?: StripeBridgeError }> {
    const module = await prepareCardTerminal(this.server);
    if (module === undefined) return UNAVAILABLE;
    const { error } = await module.connectTapToPay(locationId);
    return error === undefined ? {} : { error };
  }

  /** Whether the connected reader is this phone. */
  async connected(): Promise<boolean> {
    const reader = await cardTerminalModule()?.connectedReader();
    if (reader === undefined || reader === null) return false;
    return (STRIPE_TERMINAL.tapToPayDeviceTypes as readonly string[]).includes(
      sdkName(reader.deviceType),
    );
  }

  /** Retrieves the intent of `clientSecret`, collects the card and confirms it. */
  async collectAndConfirm(clientSecret: string): Promise<{
    readonly paymentIntent?: StripeBridgeIntent;
    readonly error?: StripeBridgeError;
  }> {
    const module = await prepareCardTerminal(this.server);
    if (module === undefined) return UNAVAILABLE;
    const { paymentIntent, error } = await module.collectAndConfirm(clientSecret);
    if (error !== undefined) return { error };
    if (paymentIntent === undefined) return {};
    return { paymentIntent: { id: paymentIntent.id, status: sdkName(paymentIntent.status) } };
  }

  /** Cancels a collect in progress. */
  async cancelCollect(): Promise<{ readonly error?: StripeBridgeError }> {
    const module = cardTerminalModule();
    if (module === undefined) return UNAVAILABLE;
    const { error } = await module.cancelCollect();
    return error === undefined ? {} : { error };
  }
}
