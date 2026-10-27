/**
 * Stackra file contract:
 * Purpose: `StripeTerminalBridge`, the few calls of Stripe Terminal's mobile SDK the `stripe-tap-to-pay` SoftPos driver
 *          needs: is Tap to Pay supported, connect this phone as the reader, collect and confirm a payment intent,
 *          cancel a collect. Each answers like the SDK, with an `error` instead of a throw.
 * Boundary: an abstract class that is its own token, key `payments.StripeTerminalBridge`. The Expo staff app binds it
 *           over the SDK's hook (discovery, the connection-token provider and the native module are the app's); this
 *           package carries no SDK and no dependency on it. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0446; ADR 0378 (decision 2); R3-SO-12.
 */
import { Port } from "@stackra/contracts";

import type { StripeBridgeError } from "#contracts/types/stripe-bridge-error.type";
import type { StripeBridgeIntent } from "#contracts/types/stripe-bridge-intent.type";

/**
 * The SDK, as the app wraps it.
 *
 * @example
 * export class ExpoStripeTerminalBridge extends Driver(StripeTerminalBridge) { … } // over useStripeTerminal()
 */
export abstract class StripeTerminalBridge extends Port {
  /** Type-only port key. */
  declare readonly "~key": "payments.StripeTerminalBridge";

  /** Whether this phone supports Tap to Pay. */
  abstract supportsTapToPay(): Promise<{
    readonly supported?: boolean;
    readonly error?: StripeBridgeError;
  }>;

  /** Discovers this phone as a Tap to Pay reader and connects it at `locationId`. */
  abstract connectTapToPay(locationId: string): Promise<{ readonly error?: StripeBridgeError }>;

  /** Whether a Tap to Pay reader is connected now. */
  abstract connected(): Promise<boolean>;

  /** Retrieves the intent of `clientSecret`, collects the card and confirms it. */
  abstract collectAndConfirm(clientSecret: string): Promise<{
    readonly paymentIntent?: StripeBridgeIntent;
    readonly error?: StripeBridgeError;
  }>;

  /** Cancels a collect in progress. */
  abstract cancelCollect(): Promise<{ readonly error?: StripeBridgeError }>;
}
