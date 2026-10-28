<!-- Purpose: the README of @stackra/native-card-terminal: what the Expo module, its drivers and its config plugin are and how an app uses them. Boundary: this package only; the decisions live in ADR 0478 and ADR 0479. Runtime: docs. Governing contract: ADR 0478, ADR 0479, ADR 0339, ADR 0446, ADR 0442 (decision 6). -->

# @stackra/native-card-terminal

Card-present payments on phones, tablets and Android tills through Stripe Terminal, as an Expo Modules API package
(ADR 0478): Stripe Bluetooth readers (Stripe Reader M2, BBPOS WisePad 3) behind the `CardTerminal` port of
`@stackra/peripherals`, and Tap to Pay on the phone behind `@stackra/payments`' `StripeTerminalBridge`. Stripe
Terminal is the first acquirer SDK here; its decision record is ADR 0479 (proposed).

**Tier:** `tier:lib` (`packages/experience/native-card-terminal`). Entries `./contracts` and `./native`, plus the
config plugin (`app.plugin.js`). Depends on `@stackra/peripherals`, `@stackra/payments`, `@stackra/platform`,
`@stackra/container` and `@stackra/contracts`; `expo` is a peer.

## What is here

| Where           | Symbol                                                               | Use                                                                                       |
| --------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `./native`      | `StripeTerminalCardTerminalDriver`                                   | `CardTerminal` driver `stripe_terminal`: pair a Bluetooth reader by serial, report state  |
| `./native`      | `NativeStripeTerminalBridgeDriver`                                   | `StripeTerminalBridge` driver `native`: Tap to Pay, collect and confirm, cancel           |
| `./contracts`   | `StripeTerminalServer`                                               | the port the host binds: connection tokens and the site's Stripe location from the server |
| `./contracts`   | `CardTerminalNativeModule`, `NativeReader`, `ConnectionTokenRequest` | the `StackraCardTerminal` Expo module's shape, for stand-ins                              |
| `app.plugin.js` | `withStackraCardTerminal`                                            | Bluetooth, location and NFC permissions; the Tap to Pay entitlement when on               |
| `ios/`          | `StackraCardTerminalModule` (Swift), podspec                         | the module over Stripe Terminal's iOS SDK (`StripeTerminal` pod)                          |
| `android/`      | `StackraCardTerminalModule` (Kotlin), Gradle                         | the module over Stripe Terminal's Android SDK (`com.stripe:stripeterminal`, Tap to Pay)   |

## Use

```ts
// app config
plugins: [["@stackra/native-card-terminal", { isTapToPayEnabled: true }]];

// the host binds the server port over its server actions (OS integrations, the tenant's Stripe Connection)
export class ServerStripeTerminalServerDriver extends Driver(StripeTerminalServer) {
  async connectionToken(): Promise<string> { … } // a fresh token minted on the server
  async locationId(): Promise<string> { … } // the site setting
}

// peripherals.cardTerminal: "stripe_terminal"
await terminal.pair({ terminalId: "STRM26138003393", provider: "stripe", address: null });
```

- A payment is always a server-created intent; the device retrieves, collects and confirms it, and the server
  captures, cancels and reconciles over the Connection. Nothing completes offline (ADR 0479 decision 5).
- The app holds no Stripe key. Tokens come from `StripeTerminalServer` on every SDK request.
- A refused Bluetooth or location permission resolves `permission_denied` on `bluetooth`; anything else that stops a
  pairing resolves `unavailable` on `card_terminal` (ADR 0253).
- Mock: `MemoryCardTerminalDriver` of `@stackra/peripherals`. Tests run the drivers against a stand-in module.

Certification pending (STA-739): the Swift and Kotlin follow Stripe's public SDK documents and are built and checked
on the box and on certified readers, not on a developer Mac.
