<!-- Purpose: the agent guide of @stackra/native-cash-drawer: where code goes, the package's rules and its PII. Boundary: this package only. Runtime: docs. Governing contract: ADR 0478, ADR 0253, ADR 0442, ADR 0458, ADR 0459. -->

# AGENTS — @stackra/native-cash-drawer

The cash drawer Expo module (ADR 0478): `src/` (binding and drivers), `ios/` (Swift), `android/` (Kotlin), `plugin/`
(config plugin), `expo-module.config.json`. Member at `packages/experience/native-cash-drawer` (`tier:lib`), in the
programming model v3.1 shape (ADR 0294, 0305). Entries `.` and `./plugin`.

## Where code goes

| You are writing…                 | It goes in…                                                       |
| -------------------------------- | ----------------------------------------------------------------- |
| A drawer port family's driver    | `src/core/drivers/<vendor>-cash-drawer.driver.ts`                 |
| A family's ready codes           | `CASH_DRAWER_VENDORS` (`src/core/constants/`)                     |
| Shared driver logic, the binding | `src/core/functions/`                                             |
| A family's Kotlin                | `android/src/<vendor>/java/com/figentra/stackra/cashdrawer/`      |
| A vendor SDK                     | `android/build.gradle` (and `ios/StackraCashDrawer.podspec`) only |
| Build-time app changes           | `plugin/functions/`, keys in `plugin/constants/`                  |
| A test                           | `__tests__/<name>.<kind>.test.ts` beside it                       |

## This package

- The port is `@stackra/peripherals/contracts`' `CashDrawer`, unchanged. A new driver name goes into
  `PERIPHERAL_DRIVERS` of `@stackra/peripherals`.
- A drawer on a receipt printer (Epson, Star, any) is `printer_kick`, @stackra/peripherals' core driver: it goes
  through the bound `ReceiptPrinter` and never talks to a printer SDK. Only a terminal's own drawer port is a family
  here.
- Every kick checks readiness first (ADR 0458 decision 3); a kick is one-way and reports no drawer state.
- The Kotlin is a thin pass-through (ADR 0458 decision 2): the SDK's own status number and the pulse. Mapping to a
  refusal is the TypeScript driver's, against `CASH_DRAWER_VENDORS`.
- A family compiles only when the runway lists it (`stackra.cashDrawer.vendors` in `gradle.properties`, written by the
  plugin). Never commit a vendor binary or source (ADR 0478 decision 4).
- The drivers import no native package: the binding reads `globalThis.expo.modules.StackraCashDrawer` when a call runs.
- `src/core/index.ts` and `plugin/index.ts` are stand-in barrels until gen writes them (STA-339); add every public file
  to its barrel and to `src/core/__tests__/index.test.ts`.
- The terminal's own drawer port needs no Bluetooth or location, so nothing asks. A Bluetooth drawer, when built, asks
  `@stackra/platform`'s injected `DevicePermissions` for `bluetooth` first and refuses `permission_denied` when it is
  denied or blocked; never add a permission prompt to the Kotlin (see `@stackra/native-scale`).
- Nothing native runs on a developer Mac; the module is checked on the box and on certified models (STA-739).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

None: a drawer kick carries no personal data. The printer address `printer_kick` reaches is the printer package's.
