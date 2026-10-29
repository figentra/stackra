/**
 * Stackra file contract:
 * Purpose: `CardTerminalNativeModule`, the `StackraCardTerminal` Expo module: a pass-through over Stripe Terminal's
 *          iOS and Android SDKs (initialise with the token relay, Bluetooth discovery and connect, Tap to Pay, the
 *          reader's state, collect and confirm, cancel, disconnect).
 * Boundary: a type only. It asks for no permission: the drivers ask @stackra/platform's `SystemPermissions` first.
 *           Every SDK call resolves with the SDK's answer or `{ error }` (its code and message, never card data) and
 *           never rejects. Codes and statuses are the SDK's enum names, unmapped; the drivers read them. The
 *           module never creates a payment intent and never enables offline mode (ADR 0479 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0479 (decisions 1, 4 and 5); ADR 0478 (decisions 2 and 5).
 */
import type { StripeBridgeError, StripeBridgeIntent } from "@stackra/payments/contracts";

import type { ConnectionTokenRequest } from "#contracts/types/connection-token-request.type";
import type { NativeReader } from "#contracts/types/native-reader.type";

/** The Expo module. */
export interface CardTerminalNativeModule {
  /** Sets up the SDK with the token relay; a second call does nothing. */
  initialize: () => Promise<void>;

  /**
   * Discovers Bluetooth readers and resolves with those seen so far once one has `serialNumber`, or with all of them
   * after `timeoutMs`; discovery keeps running until a connect or the timeout ends it.
   */
  discoverBluetoothReaders: (
    timeoutMs: number,
    serialNumber: string,
  ) => Promise<{
    readonly readers?: readonly NativeReader[];
    readonly error?: StripeBridgeError;
  }>;

  /** Connects the discovered reader of `serialNumber` at the Stripe location `locationId`. */
  connectBluetoothReader: (
    serialNumber: string,
    locationId: string,
  ) => Promise<{ readonly reader?: NativeReader; readonly error?: StripeBridgeError }>;

  /** Whether this phone supports Tap to Pay. */
  supportsTapToPay: () => Promise<{
    readonly supported?: boolean;
    readonly error?: StripeBridgeError;
  }>;

  /** Discovers this phone as a Tap to Pay reader and connects it at `locationId`. */
  connectTapToPay: (
    locationId: string,
  ) => Promise<{ readonly reader?: NativeReader; readonly error?: StripeBridgeError }>;

  /** The connected reader, or null. */
  connectedReader: () => Promise<NativeReader | null>;

  /** The SDK's payment status (`ready`, `waitingForInput`, `processing`, `notReady`; `READY`, `WAITING_FOR_INPUT`). */
  paymentStatus: () => Promise<string>;

  /** Retrieves the intent of `clientSecret`, collects the card and confirms it; `status` is the SDK's enum name. */
  collectAndConfirm: (clientSecret: string) => Promise<{
    readonly paymentIntent?: StripeBridgeIntent;
    readonly error?: StripeBridgeError;
  }>;

  /** Cancels a collect in progress. */
  cancelCollect: () => Promise<{ readonly error?: StripeBridgeError }>;

  /** Disconnects the connected reader. */
  disconnectReader: () => Promise<{ readonly error?: StripeBridgeError }>;

  /** Hands the SDK the token for `requestId`. */
  resolveConnectionToken: (requestId: string, token: string) => void;

  /** Tells the SDK the token for `requestId` could not be fetched. */
  rejectConnectionToken: (requestId: string, message: string) => void;

  /** Calls `listener` for each token request; `remove` on the answer stops it. */
  addListener: (
    eventName: "onConnectionTokenRequest",
    listener: (event: ConnectionTokenRequest) => void,
  ) => { remove: () => void };

  /** How many listeners `eventName` has (Expo's `EventEmitter.listenerCount`). */
  listenerCount: (eventName: "onConnectionTokenRequest") => number;
}
