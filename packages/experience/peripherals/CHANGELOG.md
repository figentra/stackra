# @stackra/peripherals

## 0.1.0

### Minor Changes

- 9277eeb: Kiosks, lanes and gates (STA-801, ADR 0428 to 0430): `KioskSurface` and `useKiosk` (web and native) with idle reset,
  reach layout, high contrast and audio announcements; `KioskConfig` (`platform.kiosk`) and `enterKioskOnLaunch`;
  `Scale.onWeight` weight streams; the `AccessController` port with its `memory` driver, Ed25519 receipt tokens
  (`signReceiptToken`, `verifyReceiptToken`, `importReceiptPublicKey`) and `ExitGateService`; the `external` customer
  display driver over the native `StackraCustomerDisplay` module; `BASE_DEVICE_CATALOGUE` and `deviceCatalogueOf`.
  `Scale` gains an abstract `onWeight`: a custom `Scale` driver must implement it.
- 03496b5: New `@stackra/native-cash-drawer` (ADR 0478): the `StackraCashDrawer` Expo module (Kotlin for the Sunmi and PAX drawer
  ports; a Swift half that rejects, as iOS has no drawer port) with `PrinterKickCashDrawerDriver` (through the bound
  receipt printer, probing it first), `SunmiCashDrawerDriver` and `PaxCashDrawerDriver` behind the unchanged `CashDrawer`
  port, and a config plugin that links only the families the runway lists. `@stackra/peripherals`: `SunmiCashDrawerDriver`
  and `PaxCashDrawerDriver` leave `@stackra/peripherals/native` for the new package (same names `sunmi` and `pax`);
  import them from `@stackra/native-cash-drawer`. Certification pending (STA-739).
- 830ea4a: New `@stackra/native-customer-display` (ADR 0478): the `StackraCustomerDisplay` Expo module (an Android `Presentation`
  and an iPad external-display scene, moved unchanged from the mobile app's `src/native-sources/customer-display/`) with
  `ExternalCustomerDisplayDriver` behind the unchanged `CustomerDisplay` port, and its config plugin. `@stackra/peripherals`:
  `ExternalCustomerDisplayDriver` leaves the `.` entry for the new package (same driver name `external`); import it from
  `@stackra/native-customer-display`. `@stackra/repo-checks`: `checkNativeModules` no longer exempts the mobile app's
  customer display (STA-1533).
- dfa989f: New `@stackra/native-receipt-printer` (ADR 0478): the `StackraReceiptPrinter` Expo module (Swift for Epson ePOS and
  Star StarXpand, Kotlin for Epson, Star, Sunmi and PAX) with `EpsonReceiptPrinterDriver`, `StarReceiptPrinterDriver`,
  `SunmiReceiptPrinterDriver` and `PaxReceiptPrinterDriver` behind the unchanged `ReceiptPrinter` port,
  `kickThroughPrinter` for the drawer, and a config plugin that links only the vendor families the runway lists.
  `@stackra/peripherals`: `epson` and `star` join the `peripherals.printer` driver names; `SunmiReceiptPrinterDriver` and
  `PaxReceiptPrinterDriver` leave `@stackra/peripherals/native` for the new package (same names `sunmi` and `pax`);
  import them from `@stackra/native-receipt-printer`. Certification pending (STA-739).
- b58ebce: Rename the `./electron` entry to `./desktop` (ADR 0345 decision 9): `PrintReceiptBridge`, `EscposReceiptPrinterDriver`,
  `PrinterKickCashDrawerDriver` and `HidBarcodeScannerDriver` keep their names, so only the import path changes
  (`@stackra/peripherals/desktop`). The `Memory*Driver` classes stay in `.` as the default drivers.
- e49d5c7: `EcrCardTerminalDriver` (`./desktop`, driver name `ecr` of `peripherals.cardTerminal`): a semi-integrated card terminal
  on the shop's network (`tcp://<host>:<port>`), reporting ready, busy or offline, and the byte link the payments ECR
  driver speaks through (STX/ETX/LRC frames, ACK/NAK, resends). It never reads the payload (ADR 0377 decision 1).
  `DriverName<CardTerminal>` is now `"memory" | "ecr"`. Certification pending (batch stackra-35).
- 2c2beca: Named kitchen ticket printers (`PeripheralsConfig.kitchenPrinters`: address, stations, buzzer) with the `escpos`
  `KitchenPrinter` driver (raster tickets for Arabic, `ESC B n t` buzzer) and the `peripherals.kitchen.print` bridge; the
  `hid` and `memory` `BumpBar` drivers with a configurable key map (`bumpBarKeys`); scale presets (`scalePresets`,
  `scalePreset`, `retail` and `precision`) applied by `fitScaleReading`; the `UsedReceiptStore` port with its `memory`
  driver, now a dependency of `ExitGateService` (constructor gains a fourth parameter) and a new `store` exit reason
  (STA-925, ADR 0449).
- 5c266dc: Add the `LabelPrinter`, `CustomerDisplay` and `CardTerminal` ports (ADR 0339) with memory drivers, the `channel`
  customer display driver and `listenCustomerDisplay`, the desktop `ZplLabelPrinterDriver` and `PrintLabelBridge`
  (`peripherals.label.print`), `parseEmbeddedBarcode` for weight- and price-embedded barcodes read through market-pack
  layouts, and `PeripheralsConfig` fields `labelPrinter`, `customerDisplay`, `cardTerminal` and `labelPrinterAddress`.
- c402bab: New `./native` entry: the Sunmi, PAX and iMin drivers of the native Android till (ADR 0442 decision 4; vendor ADRs
  0458, 0459 and 0460). `sunmi`, `pax` and `imin` are now driver names of `peripherals.printer`, `.drawer` and
  `.scanner`, so `DriverName<ReceiptPrinter>`, `DriverName<CashDrawer>` and `DriverName<BarcodeScanner>` each gain the
  three. Each driver reads its family's Expo module (`StackraSunmi`, `StackraPax`, `StackraImin`) at call time and
  refuses where it is absent. Certification pending: built from public SDK documents with recorded-fixture tests
  (batch stackra-50).
- 2787c1e: Add `@stackra/peripherals`, the point-of-sale peripherals of ADR 0253: the `ReceiptPrinter`, `CashDrawer`,
  `BarcodeScanner` and `Scale` ports in `./contracts`, whose calls resolve a typed refusal when no device answers;
  `PeripheralsConfig` (key `peripherals`) with its shipped schema, four memory drivers and `PrinterUnavailableError` in
  `.`; and in `./electron` the `PrintReceiptBridge` (`peripherals.receipt.print`) with the main-process drivers
  `EscposReceiptPrinterDriver` (ESC/POS over TCP or a device path), `PrinterKickCashDrawerDriver` (the drawer kicks
  through the printer) and `HidBarcodeScannerDriver` (keyboard-wedge scans read with no native module).
- c968ffd: The `ScannerScale` and `BaggingScale` ports (read, stream, zero) for tills and self-checkout, the `LabelScale` item and
  price sync port, and the `DriveThroughLane` port (car sensor, order confirm board), each with its `memory` driver and a
  `PeripheralsConfig` driver field; `parseGs1ElementString` reads GS1-128 and DataBar codes by application identifier
  (GTIN, net weight 310n/320n, price 392n/393n) on top of the GS1 check digit (STA-965).
- cfaa96b: `PrinterKickCashDrawerDriver` (`printer_kick`) moves from `@stackra/peripherals/desktop` to `@stackra/peripherals`, so
  desktop and Expo apps share one driver, and it now probes the printer before the pulse (ADR 0458 decision 3).
  `@stackra/native-cash-drawer` drops its copy and its `@stackra/native-receipt-printer` dependency (ADR 0478 decision 5).

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- 90957bd: Breaking renames for unique public names (STA-1383): `@stackra/platform` `Capability` is `PlatformCapability` (iam's
  `Capability` is the permission capability), and the `@stackra/platform/contracts` port `PushTransport` (this device's
  push registration) is `PlatformPushTransport`, keyed `platform.PlatformPushTransport` (notifications' `PushTransport`
  is the server send). Drivers keep their names; importers in peripherals and navigation are updated.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [9277eeb]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [3a94a6e]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [de4d77d]
- Updated dependencies [cc96d5d]
- Updated dependencies [d63f012]
- Updated dependencies [072dc7e]
- Updated dependencies [b58ebce]
- Updated dependencies [1723c05]
- Updated dependencies [d15a219]
- Updated dependencies [8ce76e9]
- Updated dependencies [c46f32f]
- Updated dependencies [2c2beca]
- Updated dependencies [9e63234]
- Updated dependencies [04a0f8c]
- Updated dependencies [544b42d]
- Updated dependencies [2787c1e]
- Updated dependencies [90957bd]
- Updated dependencies [1b4effa]
- Updated dependencies [6855121]
- Updated dependencies [d7ed271]
- Updated dependencies [3b19f6d]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/config@0.1.0
  - @stackra/platform@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
