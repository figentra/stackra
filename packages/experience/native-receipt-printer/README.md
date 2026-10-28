<!-- Purpose: the README of @stackra/native-receipt-printer: what the Expo module and its drivers are and how an app uses them. Boundary: this package only; the decisions live in the ADRs it names. Runtime: docs. Governing contract: ADR 0478, ADR 0253, ADR 0442, ADR 0458, ADR 0459. -->

# @stackra/native-receipt-printer

The receipt printer of an Expo app, as one Expo Modules API package (ADR 0478): the `StackraReceiptPrinter` module in
Swift and Kotlin, one TypeScript driver per vendor behind the unchanged `ReceiptPrinter` port of
`@stackra/peripherals/contracts`, and a config plugin that links only the vendor families the app's runway lists. A
call no printer can honour resolves the typed refusal of `CapabilityResult` (capability `print`), never an exception
(ADR 0253). The mock is `@stackra/peripherals`' `MemoryReceiptPrinterDriver`.

**Tier:** `tier:lib` (`packages/experience/native-receipt-printer`). Entry `.` (drivers), plus `app.plugin.js`, which hands
Expo the built config plugin (`plugin/`, not an export). Depends on `@stackra/peripherals` (the port, `PeripheralsConfig`),
`@stackra/container` (`Driver`) and `@stackra/platform` (capability codes). `expo` is a peer.

## What is here

| Entry | Symbol                                                  | Use                                                                                                      |
| ----- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `.`   | `EpsonReceiptPrinterDriver`, `StarReceiptPrinterDriver` | `peripherals.printer: "epson"` or `"star"`: a network printer, iOS and Android                           |
| `.`   | `SunmiReceiptPrinterDriver`, `PaxReceiptPrinterDriver`  | `"sunmi"` or `"pax"`: the Android terminal's built-in printer (moved from `@stackra/peripherals/native`) |
| `.`   | `kickThroughPrinter`                                    | probe, then pulse the drawer pin; used by `@stackra/native-cash-drawer`'s `printer_kick`                 |

| Folder                    | Holds                                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/`                    | the module binding (a registry lookup at call time) and the four drivers                                  |
| `ios/`                    | Swift: the module and the Epson ePOS and Star StarXpand pass-throughs; the podspec                        |
| `android/`                | Kotlin: the module and one source set per vendor (Epson, Star, Sunmi, PAX); `build.gradle`                |
| `plugin/`                 | the config plugin: linked vendors, vendor repositories, the Sunmi service query, the local network string |
| `expo-module.config.json` | the module names autolinking registers                                                                    |

## Use

```ts
// app.config.ts, as gen writes it from the runway's device:<family> list
plugins: [
  ["@stackra/native-receipt-printer", { vendors: ["epson", "sunmi"], localNetworkUsage: t("...") }],
];

export class PeripheralsConfig extends BasePeripheralsConfig {
  override printer: DriverName<ReceiptPrinter> = "epson";
  override printerAddress = "tcp://10.0.0.20:9100";
}
```

- **Network printers** (`epson`, `star`) read `peripherals.printerAddress`; only `tcp://<host>:<port>` is reachable
  (Epson target `TCP:<host>`, Star LAN identifier `<host>`). Bluetooth and USB targets are not built.
- **Built-in printers** (`sunmi`, `pax`) need no address; their drawer port ignores the pin.
- The module is a pass-through: it returns the vendor SDK's own status number, and the TypeScript driver reads it
  against the vendor's ready codes (Epson `online` 1, Star `hasError` 0, Sunmi `updatePrinterState()` 1, PAX
  `getStatus()` 0). Lines go over as text with control characters dropped.
- `print` probes first; `kickDrawer` sends the pulse only. The drawer's readiness check before a kick is
  `kickThroughPrinter` (ADR 0458 decision 3).
- Where the module is absent (web, desktop, a build that does not link the vendor) every call refuses.

## Vendor SDKs

No vendor binary or source is in this package (ADR 0478 decision 4). The build fetches them:

| Vendor | Android                                                          | iOS                                                      |
| ------ | ---------------------------------------------------------------- | -------------------------------------------------------- |
| Epson  | `android.epson` `{ repository, coordinate }` from Epson's portal | `ios.epsonFramework`: the path of `libepos2.xcframework` |
| Star   | `com.starmicronics:stario10` on Maven Central                    | `StarIO10` pod (`ios.starVersion` to pin)                |
| Sunmi  | `com.sunmi:printerlibrary` on Maven Central                      | none (Android terminal)                                  |
| PAX    | `android.pax` `{ repository, coordinate }` from the PAX portal   | none (Android terminal)                                  |

The default Maven coordinates and the Epson series (TM-T88 class) are certification rows.

## Testing

The drivers are tested against a stand-in `StackraReceiptPrinter` module that replays transcribed vendor SDK answers
(`src/core/__tests__/receipt-printer-sdk.fixture.ts`); the plugin's helpers are tested on plain objects. The Swift and
Kotlin are checked on the box and on certified models (STA-739), not on a developer Mac. **Certification pending.**
