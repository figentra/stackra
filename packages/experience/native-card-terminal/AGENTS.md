<!-- Purpose: the agent guide of @stackra/native-card-terminal: where code goes, the package's rules and its PII. Boundary: this package only. Runtime: docs. Governing contract: ADR 0478, ADR 0479, ADR 0339, ADR 0446, ADR 0253. -->

# AGENTS — @stackra/native-card-terminal

The card terminal Expo module (ADR 0478): Stripe Terminal's iOS and Android SDKs behind `CardTerminal`
(`@stackra/peripherals/contracts`) and `StripeTerminalBridge` (`@stackra/payments/contracts`). Member at
`packages/experience/native-card-terminal` (`tier:lib`), programming model v3.1 (ADR 0294, 0305). Entries
`./contracts`, `./native`; config plugin `app.plugin.js` → `plugin/`.

## Where code goes

| You are writing…               | It goes in…                                                        |
| ------------------------------ | ------------------------------------------------------------------ |
| A port or a type of the module | `src/contracts/ports/`, `src/contracts/types/`                     |
| A driver behind a port         | `src/native/drivers/<name>-<port>.driver.ts`                       |
| Shared driver logic, refusals  | `src/native/functions/`                                            |
| SDK names the drivers read     | `src/native/constants/stripe-terminal.constant.ts`                 |
| A config plugin edit           | `plugin/functions/` (pure), composed in `plugin/index.ts`          |
| Swift / Kotlin                 | `ios/`, `android/src/main/java/com/figentra/stackra/cardterminal/` |
| A test                         | `__tests__/<name>.test.ts` beside it                               |

## This package

- Each acquirer SDK needs its own ADR before code (ADR 0442 decision 6). Stripe Terminal's is ADR 0479; a second
  acquirer is a new ADR, a new driver and new native files here.
- The native module is a pass-through: it resolves with the SDK's answer or `{ error }` and never rejects. Enum
  names cross as the SDK names them (Swift spells out the Objective-C cases in `SdkNames.swift`); the TypeScript
  drivers decide what they mean (`sdkName`, `sdkRefusal`).
- Never create a payment intent on the device, never enable the SDK's offline mode, never hold a Stripe secret key,
  restricted key or account id. Connection tokens come from `StripeTerminalServer` on each request and are never
  stored; a failed fetch is answered as `connection_token_failed`. `no-secret-key.test.ts` guards the sources.
- Drivers read the module from `globalThis.expo.modules` when they run; no file under `src/` imports a native package
  or `expo`. Only `plugin/` imports `expo/config-plugins`.
- Ask for Bluetooth and location only through the injected `DevicePermissions` of `@stackra/platform`, before
  discovery or Tap to Pay; never add a permission prompt to the module. Denied or blocked is `permission_denied`.
- `CardTerminal` pairs and reports; the payment is the payments driver's (ADR 0339 decision 1). Refuse with
  `permission_denied` on `bluetooth` or `unavailable` on `card_terminal`, never throw (ADR 0253).
- Vendor SDKs are declared only in `ios/StackraCardTerminal.podspec` and `android/build.gradle` (ADR 0478 decision 4).
- `src/*/index.ts` are stand-in barrels until gen writes them (STA-339); add every public file to its barrel and to
  that entry's `index.test.ts`.
- Nothing here is built or run on a developer Mac; the box and certified readers (STA-739) check the native code.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data                 | Where                                  | Handling                                                                      |
| -------------------- | -------------------------------------- | ----------------------------------------------------------------------------- |
| Card data            | Stripe's SDK on the device             | Never crosses to JavaScript; the module returns only the intent id and status |
| Connection token     | `StripeTerminalServer.connectionToken` | Handed to the SDK once; never stored, logged or put in an error               |
| Intent client secret | `collectAndConfirm(clientSecret)`      | Passed to the SDK only; never logged                                          |
| Reader serial        | `TerminalPairing.terminalId`           | A device id, not personal data; shown as the terminal's id                    |
| Location             | iOS/Android location permission        | Used by the SDK for Stripe's checks; never read or stored here                |
