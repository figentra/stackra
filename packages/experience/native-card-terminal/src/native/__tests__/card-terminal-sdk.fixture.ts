/**
 * Stackra file contract:
 * Purpose: `CARD_TERMINAL_SDK`, the Stripe Terminal SDK answers the `./native` tests replay (readers, device types,
 *          payment statuses, intent statuses and error codes as each platform names them), with `install`, which puts
 *          a stand-in `StackraCardTerminal` Expo module on `globalThis.expo`, and `uninstall`.
 * Boundary: test only. The names are transcribed from Stripe's public iOS and Android SDK documents; they are replaced
 *           by recordings from certified readers at certification (STA-739). Every mock records every argument; the
 *           stand-in keeps the connected reader the way the SDK does, so connect, status and disconnect agree.
 * Runtime: node (vitest)
 * Governing contract: ADR 0479; ADR 0478 (decision 5); ADR 0022 (test placement).
 */
import type { Mock } from "vitest";
import { vi } from "vitest";

import type { CardTerminalNativeModule } from "#contracts/types/card-terminal-native-module.type";
import type { ConnectionTokenRequest } from "#contracts/types/connection-token-request.type";
import type { NativeReader } from "#contracts/types/native-reader.type";

/** The stand-in module: each method as a recording mock, plus the token-request replay. */
type StandInModule = {
  readonly [K in keyof CardTerminalNativeModule]: Mock<CardTerminalNativeModule[K]>;
} & {
  /** Sends a token request to every listener, as the SDK does when it needs a token. */
  requestToken: (event: ConnectionTokenRequest) => void;
  /** Sets the reader the SDK reports as connected. */
  setConnected: (reader: NativeReader | null) => void;
};

/** Readers as the SDK reports them on each platform. */
const READER = {
  iosM2: { serialNumber: "STRM26138003393", deviceType: "stripeM2" },
  androidWisePad: { serialNumber: "WPC323106000123", deviceType: "WISEPAD_3" },
  iosTapToPay: { serialNumber: "tap-to-pay-ios", deviceType: "tapToPay" },
  androidTapToPay: { serialNumber: "tap-to-pay-android", deviceType: "TAP_TO_PAY_DEVICE" },
} as const;

/** SDK error codes as each platform names them. */
const ERROR = {
  iosBluetoothDenied: { code: "bluetoothAccessDenied", message: "Bluetooth access denied" },
  androidBluetoothDenied: { code: "BLUETOOTH_PERMISSION_DENIED" },
  androidLocationOff: { code: "LOCATION_SERVICES_DISABLED" },
  iosConnectFailed: { code: "bluetoothConnectTimedOut" },
  iosDeclined: { code: "declinedByStripeAPI", message: "Your card was declined." },
  androidCanceled: { code: "CANCELED" },
} as const;

/** The fixture's written type: the declaration build cannot name vitest's internal `Procedure` from an inferred one. */
interface CardTerminalSdk {
  readonly reader: typeof READER;
  readonly error: typeof ERROR;
  /** Puts a stand-in module on the Expo registry; `answers` replaces any default answer. */
  install: (answers?: Partial<CardTerminalNativeModule>) => StandInModule;
  /** Removes the stand-in registry. */
  uninstall: () => void;
}

/** The recorded SDK answers and the stand-in module. */
export const CARD_TERMINAL_SDK: CardTerminalSdk = {
  reader: READER,
  error: ERROR,

  /** Puts a stand-in module on the Expo registry; `answers` replaces any default answer. */
  install(answers: Partial<CardTerminalNativeModule> = {}): StandInModule {
    const listeners: Array<(event: ConnectionTokenRequest) => void> = [];
    let connected: NativeReader | null = null;
    const fn = <K extends keyof CardTerminalNativeModule>(
      name: K,
      fallback: CardTerminalNativeModule[K],
    ): Mock<CardTerminalNativeModule[K]> =>
      vi.fn<CardTerminalNativeModule[K]>(answers[name] ?? fallback);
    const module: StandInModule = {
      initialize: fn("initialize", async () => undefined),
      discoverBluetoothReaders: fn("discoverBluetoothReaders", async () => ({
        readers: [READER.iosM2, READER.androidWisePad],
      })),
      connectBluetoothReader: fn("connectBluetoothReader", async (serialNumber) => {
        const reader =
          Object.values(READER).find((one) => one.serialNumber === serialNumber) ?? READER.iosM2;
        connected = reader;
        return { reader };
      }),
      supportsTapToPay: fn("supportsTapToPay", async () => ({ supported: true })),
      connectTapToPay: fn("connectTapToPay", async () => {
        connected = READER.iosTapToPay;
        return { reader: READER.iosTapToPay };
      }),
      connectedReader: fn("connectedReader", async () => connected),
      paymentStatus: fn("paymentStatus", async () => "ready"),
      collectAndConfirm: fn("collectAndConfirm", async () => ({
        paymentIntent: { id: "pi_3QxTest", status: "requiresCapture" },
      })),
      cancelCollect: fn("cancelCollect", async () => ({})),
      disconnectReader: fn("disconnectReader", async () => {
        connected = null;
        return {};
      }),
      resolveConnectionToken: fn("resolveConnectionToken", () => undefined),
      rejectConnectionToken: fn("rejectConnectionToken", () => undefined),
      addListener: fn("addListener", (_eventName, listener) => {
        listeners.push(listener);
        return {
          remove: (): void => {
            listeners.splice(listeners.indexOf(listener), 1);
          },
        };
      }),
      listenerCount: fn("listenerCount", () => listeners.length),
      requestToken(event: ConnectionTokenRequest): void {
        for (const listener of listeners) listener(event);
      },
      setConnected(reader: NativeReader | null): void {
        connected = reader;
      },
    };
    (globalThis as { expo?: unknown }).expo = { modules: { StackraCardTerminal: module } };
    return module;
  },

  /** Removes the stand-in registry. */
  uninstall(): void {
    delete (globalThis as { expo?: unknown }).expo;
  },
};
