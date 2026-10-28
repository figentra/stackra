<!-- Purpose: the README of @stackra/native-cash-drawer: what the Expo module and its drivers are and how an app uses them. Boundary: this package only; the decisions live in the ADRs it names. Runtime: docs. Governing contract: ADR 0478, ADR 0253, ADR 0442, ADR 0458, ADR 0459. -->

# @stackra/native-cash-drawer

The cash drawer of an Expo app, as one Expo Modules API package (ADR 0478): the `StackraCashDrawer` module in Kotlin
(and a Swift half that links no family), three TypeScript drivers behind the unchanged `CashDrawer` port of
`@stackra/peripherals/contracts`, and a config plugin that links only the drawer port families the app's runway lists. A
call no drawer can honour resolves the typed refusal of `CapabilityResult` (capability `print`, because a drawer opens
through a printer), never an exception (ADR 0253). The mock is `@stackra/peripherals`' `MemoryCashDrawerDriver`.

**Tier:** `tier:lib` (`packages/experience/native-cash-drawer`). Entries `.` (drivers) and `./plugin` (the config
plugin, which `app.plugin.js` hands Expo). Depends on `@stackra/native-receipt-printer` (`kickThroughPrinter`),
`@stackra/peripherals` (the port, `PeripheralsConfig`), `@stackra/container` and `@stackra/platform`. `expo` is a peer.

## What is here

| Entry      | Symbol                                         | Use                                                                                                 |
| ---------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `.`        | `PrinterKickCashDrawerDriver`                  | `peripherals.drawer: "printer_kick"`: the drawer on the receipt printer (Epson, Star, any)          |
| `.`        | `SunmiCashDrawerDriver`, `PaxCashDrawerDriver` | `"sunmi"` or `"pax"`: the Android terminal's drawer port (moved from `@stackra/peripherals/native`) |
| `./plugin` | default export, `CashDrawerPluginProps`        | the config plugin and its options                                                                   |

| Folder                    | Holds                                                                            |
| ------------------------- | -------------------------------------------------------------------------------- |
| `src/`                    | the module binding (a registry lookup at call time) and the three drivers        |
| `ios/`                    | Swift: the module, which rejects (iOS has no drawer port family); the podspec    |
| `android/`                | Kotlin: the module and one source set per family (Sunmi, PAX); `build.gradle`    |
| `plugin/`                 | the config plugin: linked families, vendor repositories, the Sunmi service query |
| `expo-module.config.json` | the module names autolinking registers                                           |

## Use

```ts
// app.config.ts, as gen writes it from the runway
plugins: [["@stackra/native-cash-drawer", { vendors: ["sunmi"] }]];

export class PeripheralsConfig extends BasePeripheralsConfig {
  override drawer: DriverName<CashDrawer> = "printer_kick"; // or "sunmi", "pax"
  override drawerPin: DrawerPin = 2;
}
```

- **`printer_kick`** probes the bound `ReceiptPrinter` and pulses `peripherals.drawerPin` through it only when the
  printer is ready (ADR 0458 decision 3), with `kickThroughPrinter` from `@stackra/native-receipt-printer`. It works
  with any printer driver, so it needs no family of its own here. The same name as `@stackra/peripherals/desktop`'s
  driver, so one runway value serves the desktop and the native targets.
- **`sunmi`, `pax`** read the status of the printer that drives the drawer port before every kick (Sunmi
  `updatePrinterState()` 1, PAX `getStatus()` 0) and then pulse the port. The pin does not apply.
- A kick is one-way: success means the SDK took the pulse, not that the drawer opened. No open/closed state is read.
- Where the module is absent (web, desktop, iOS for `sunmi`/`pax`, a build that does not link the family) every call
  refuses.

## Vendor SDKs

No vendor binary or source is in this package (ADR 0478 decision 4). Sunmi comes from Maven Central
(`com.sunmi:printerlibrary`); PAX NeptuneLite from the PAX portal via the plugin option `android.pax`
`{ repository, coordinate }`. The default coordinate is a certification row.

## Testing

The drivers are tested against a stand-in `StackraCashDrawer` module that replays transcribed vendor SDK answers
(`src/core/__tests__/cash-drawer-sdk.fixture.ts`), and `printer_kick` against the `memory` printer and the Epson driver
on a stand-in printer module; the plugin's helpers are tested on plain objects. The Kotlin and Swift are checked on the
box and on certified models (STA-739). **Certification pending.**
