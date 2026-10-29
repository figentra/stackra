<!-- Purpose: the agent guide of @stackra/native-receipt-printer: where code goes, the package's rules and its PII. Boundary: this package only. Runtime: docs. Governing contract: ADR 0478, ADR 0253, ADR 0442, ADR 0458, ADR 0459. -->

# AGENTS — @stackra/native-receipt-printer

The receipt printer Expo module (ADR 0478): `src/` (binding and drivers), `ios/` (Swift), `android/` (Kotlin),
`plugin/` (config plugin), `expo-module.config.json`. Member at `packages/experience/native-receipt-printer`
(`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.` and `./plugin`.

## Where code goes

| You are writing…                        | It goes in…                                                          |
| --------------------------------------- | -------------------------------------------------------------------- |
| A vendor's driver                       | `src/core/drivers/<vendor>-receipt-printer.driver.ts`                |
| A vendor's ready codes or target prefix | `RECEIPT_PRINTER_VENDORS` (`src/core/constants/`)                    |
| Shared driver logic, the binding        | `src/core/functions/`                                                |
| A vendor's Kotlin                       | `android/src/<vendor>/java/com/figentra/stackra/receiptprinter/`     |
| A vendor's Swift                        | `ios/<Vendor>/`, behind its `STACKRA_<VENDOR>` compilation condition |
| A vendor SDK                            | `android/build.gradle` and `ios/StackraReceiptPrinter.podspec` only  |
| Build-time app changes                  | `plugin/functions/`, keys in `plugin/constants/`                     |
| A test                                  | `__tests__/<name>.<kind>.test.ts` beside it                          |

## This package

- The port is `@stackra/peripherals/contracts`' `ReceiptPrinter`, unchanged. A new driver name goes into
  `PERIPHERAL_DRIVERS` of `@stackra/peripherals` (both augment the same `DriverRegistry` key).
- The Swift and Kotlin are thin pass-throughs (ADR 0458 decision 2): they return the SDK's own status number, print
  text and pulse the drawer. Mapping a vendor answer to a refusal is the TypeScript driver's, against
  `RECEIPT_PRINTER_VENDORS`. A call no printer can honour resolves `refuse(PlatformCapability.Print, ...)`.
- A vendor family compiles only when the runway lists it: the plugin writes `stackra.receiptPrinter.vendors` into
  `gradle.properties` and `Podfile.properties.json`, and the Gradle file and podspec add that family's sources and SDK
  only. Never commit a vendor binary or source (ADR 0478 decision 4).
- The drivers import no native package: the binding reads `globalThis.expo.modules.StackraReceiptPrinter` when a call
  runs, so the entry loads anywhere and refuses where the module is absent.
- Lines are text, never printer commands: control characters are dropped before they reach the module.
- No user-facing text here: the iOS local network string comes translated from the app's plugin options.
- `src/core/index.ts` and `plugin/index.ts` are stand-in barrels until gen writes them (STA-339); add every public file
  to its barrel and to `src/core/__tests__/index.test.ts`.
- Built-in and network printers need no Bluetooth or location, so nothing asks. A Bluetooth or USB target, when built,
  asks `@stackra/platform`'s injected `DevicePermissions` for `bluetooth` first and refuses `permission_denied` when it
  is denied or blocked; never add a permission prompt to the Swift or Kotlin (see `@stackra/native-scale`).
- Nothing native runs on a developer Mac; the module is checked on the box and on certified models (STA-739).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data            | Where                              | Handling                                                                 |
| --------------- | ---------------------------------- | ------------------------------------------------------------------------ |
| Receipt lines   | `ReceiptPrinter.print`, the module | Sent to the printer only; never logged, never put in a refusal's details |
| Printer address | `PeripheralsConfig.printerAddress` | On the user's own network; the answer names the vendor, not the address  |
