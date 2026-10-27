<!-- Purpose: the README of @stackra/peripherals: what the ports, drivers, parsers and bridges are and how a host uses them. Boundary: this package only; the decisions live in the ADRs it names. Runtime: docs. Governing contract: ADR 0253, ADR 0339, ADR 0377, ADR 0442, ADR 0449, ADR 0458 to 0460, STA-965. -->

# @stackra/peripherals

Stackra peripherals: the point-of-sale hardware a client drives itself (ADR 0253, ADR 0339). Seven ports,
`ReceiptPrinter`, `LabelPrinter`, `CashDrawer`, `BarcodeScanner`, `Scale`, `CustomerDisplay` and `CardTerminal`, each a
capability with a driver per target. A call that no device can
honour resolves a typed refusal (`unavailable`, `permission_denied`) in the `CapabilityResult` shape of
`@stackra/platform`, never an exception. Receipts are ESC/POS, the drawer kicks through the printer, and the scanner is
a keyboard-wedge HID device. A peripheral is hardware the client uses; a device that is a principal belongs to
`@stackra/devices` (ADR 0235).

**Tier:** `tier:lib` (`packages/experience/peripherals`). Entries `.`, `./contracts`, `./desktop` and `./native` (ADR
0127 2026-10-24 note: a runtime-target entry; `./native` is the Android till of ADR 0442). Depends on `@stackra/platform` (capability codes, the result shape, the
`Bridge` kind), `@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/validation` and
`@stackra/errors`. Electron is an optional peer of `./desktop`.

## What is here

| Entry         | Symbol                                                                                                                                                                                                       | Use                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `.`           | `PeripheralsConfig` (+ `PeripheralsConfig$`)                                                                                                                                                                 | the configuration (key `peripherals`): drivers, printer address, drawer pin, scan key gap |
| `.`           | `MemoryReceiptPrinterDriver`, `MemoryCashDrawerDriver`, `MemoryBarcodeScannerDriver`, `MemoryScaleDriver`                                                                                                    | the `memory` candidates: tests, web builds, a till with no hardware yet                   |
| `.`           | `PrinterUnavailableError`                                                                                                                                                                                    | the refusal the print bridge sends back when the printer refused (`printer_unavailable`)  |
| `./contracts` | `ReceiptPrinter`, `CashDrawer`, `BarcodeScanner`, `Scale`; `Receipt`, `PrintedReceipt`, `DrawerPin`, `ScaleReading`                                                                                          | the ports, injected by type (from here only)                                              |
| `./desktop`   | `PrintReceiptBridge`                                                                                                                                                                                         | `peripherals.receipt.print`, the renderer's only way to the printer                       |
| `./desktop`   | `EscposReceiptPrinterDriver`, `PrinterKickCashDrawerDriver`, `HidBarcodeScannerDriver`                                                                                                                       | the main-process drivers `escpos`, `printer_kick` and `hid`                               |
| `./native`    | `SunmiReceiptPrinterDriver`, `PaxCashDrawerDriver`, `IminBarcodeScannerDriver` and the other six (three per family)                                                                                          | the Android till drivers `sunmi`, `pax` and `imin` (ADR 0442; certification pending)      |
| `./contracts` | `LabelPrinter`, `CustomerDisplay`, `CardTerminal`; `LabelFormat`, `TerminalState`; `Label`, `RasterImage`, `PrintedLabel`, `CustomerDisplayView`, `CustomerDisplayLine`, `TerminalPairing`, `PairedTerminal` | the ports of ADR 0339 decision 1 and their types                                          |
| `.`           | `MemoryLabelPrinterDriver`, `MemoryCustomerDisplayDriver`, `MemoryCardTerminalDriver`                                                                                                                        | the `memory` candidates of the three new ports                                            |
| `.`           | `ChannelCustomerDisplayDriver`, `listenCustomerDisplay`, `CUSTOMER_DISPLAY_CHANNEL`                                                                                                                          | the `channel` customer display: the till posts views, the display window listens          |
| `.`           | `parseEmbeddedBarcode`, `EmbeddedValue`, `EmbeddedBarcode`, `EmbeddedBarcodeLayout`                                                                                                                          | weight- and price-embedded barcodes (prefix 2x) read through market-pack layouts          |
| `.`           | `LabelPrinterUnavailableError`                                                                                                                                                                               | the refusal the label bridge sends back (`label_printer_unavailable`)                     |
| `./desktop`   | `PrintLabelBridge`, `ZplLabelPrinterDriver`                                                                                                                                                                  | `peripherals.label.print` and the main-process `zpl` driver                               |
| `./contracts` | `KitchenPrinter`, `BumpBar`, `UsedReceiptStore`; `BumpBarKey`; `KitchenTicket`, `ScalePreset`                                                                                                                | kitchen tickets, the bump bar and the venue's used receipts (ADR 0449)                    |
| `.`           | `MemoryKitchenPrinterDriver`, `MemoryBumpBarDriver`, `MemoryUsedReceiptStoreDriver`, `fitScaleReading`                                                                                                       | their `memory` candidates, and a reading put through the scale preset                     |
| `./desktop`   | `PrintKitchenTicketBridge`, `EscposKitchenPrinterDriver`, `HidBumpBarDriver`                                                                                                                                 | `peripherals.kitchen.print` and the main-process `escpos` and `hid` drivers               |
| `./contracts` | `ScannerScale`, `BaggingScale`, `LabelScale`, `DriveThroughLane`; `LabelScaleItem`, `LaneCar`                                                                                                                | grocery scales, self-checkout bagging and drive-through lanes (STA-965)                   |
| `.`           | `MemoryScannerScaleDriver`, `MemoryBaggingScaleDriver`, `MemoryLabelScaleDriver`, `MemoryDriveThroughLaneDriver`                                                                                             | their `memory` candidates (the only drivers until a vendor's ships with its ADR)          |
| `./desktop`   | `EcrCardTerminalDriver`                                                                                                                                                                                      | the `ecr` card terminal: a semi-integrated terminal on the network, the payments ECR link |
| `.`           | `parseGs1ElementString`, `Gs1ElementString`                                                                                                                                                                  | GS1-128 and DataBar codes read by application identifier: GTIN, net weight, price         |

## Using it

```ts
import { PeripheralsConfig as BasePeripheralsConfig } from "@stackra/peripherals";

export class PeripheralsConfig extends BasePeripheralsConfig {
  override printer: DriverName<ReceiptPrinter> = "escpos";
  override drawer: DriverName<CashDrawer> = "printer_kick";
  override scanner: DriverName<BarcodeScanner> = "hid";
  override probeOnBoot = true;
}
```

`printerAddress` is `tcp://<host>:<port>` for a network printer or a device path (`/dev/usb/lp0` on Linux, a shared
printer `\\localhost\<share>` on Windows); empty means no printer, so every print refuses with `unavailable`.
`drawerPin` (2 or 5) and `scanKeyGap` (default `PT0.05S`) are the calibration a drawer and a scanner need.

The desktop renderer prints through the bridge the generated preload allows:

```ts
const result = await window.stackra.invoke("peripherals.receipt.print", {
  orderId,
  lines: ["Total 12.00"],
});
if (result.ok) toast.success(t(I18n.console.receipt.printed, { printer: result.data.printer }));
else toast.warning(t(I18n.console.errors[result.error.code])); // printer_unavailable
```

Main-process code and tests inject the ports:

```ts
const opened = await drawer.open(); // CapabilityResult
const stop = scanner.onScan((code) => cart.addByBarcode(code));
```

## Labels, the customer display, card terminals and scale barcodes

```ts
// a label from a studio template (ZPL), or a raster the renderer drew (Arabic labels)
await labels.print({ jobId, copies: 2, format: LabelFormat.Zpl, zpl });

// the till posts; the customer display route (an Electron second window, a browser window) listens
await display.show({
  lines: [{ label: "Latte", amount: "SAR 18.00" }],
  total: "SAR 18.00",
  message: null,
});
useEffect(() => listenCustomerDisplay(setView), []);

// pairing only; the payment is the payments driver's protocol
await terminal.pair({ terminalId: "T-0042", provider: "geidea", address: null });

// a semi-integrated terminal on the shop's network (`peripherals.cardTerminal: "ecr"`, main process)
await ecrTerminal.pair({
  terminalId: "T-0042",
  provider: "geidea",
  address: "tcp://10.0.0.30:6000",
});
const gateway = new EcrTerminalGateway({ id, profile, link: ecrTerminal, currency }); // @stackra/payments

// a scale's barcode, read through the market pack's layouts
const scanned = parseEmbeddedBarcode(code, pack.barcodeLayouts); // { itemCode, kind: "weight", value: "1.250", unit: "kg" }
```

- `labelPrinterAddress` is `tcp://<host>:<port>` or a device path, as `printerAddress` is.
- The second window itself is opened by `@stackra/platform`'s `SecondScreen` port on the desktop.
- A barcode that matches no layout, or fails its GS1 check digit, parses to `null`: scan it as an ordinary code.
- An RFID reader port is later (MUS-90), not here.
- The `ecr` card terminal (ADR 0377) pairs to a `tcp://<host>:<port>` address and is the link the payments ECR
  driver speaks through: `exchange` sends one frame (STX, payload, ETX, LRC; ACK or NAK, resent up to the provider's
  `retries`) and returns the answer, `signal` sends a cancel beside it. It reports `busy` while an exchange runs and
  `offline` when no connection opens. It never reads the payload: the protocol and its timing are the provider's
  `EcrProfile` in `@stackra/payments`. Serial, USB and Bluetooth links need native transports and are not built.
  Certification pending: no Geidea or Network International specification or test terminal has been used.

## Kitchen printers, bump bars, scale presets and several exits

```ts
export class PeripheralsConfig extends BasePeripheralsConfig {
  override kitchenPrinter: DriverName<KitchenPrinter> = "escpos";
  override bumpBar: DriverName<BumpBar> = "hid";
  override kitchenPrinters: BasePeripheralsConfig["kitchenPrinters"] = {
    grill: { address: "tcp://10.0.0.30:9100", stations: ["grill"], buzz: { times: 2, length: 3 } },
    cold_line: { address: "tcp://10.0.0.31:9100", stations: ["cold", "dessert"], buzz: null },
  };
  override scalePreset = "precision"; // 0.01 g up to 600 g
}

// renderer: an Arabic ticket goes as a raster the renderer drew; the lines stay for the audit
await window.stackra.invoke("peripherals.kitchen.print", {
  orderId,
  station: "grill",
  lines,
  raster,
});
const stop = bumpBar.onKey((key) =>
  key === BumpBarKey.Bump ? board.bumpSelected() : board.move(key),
);
const weight = fitScaleReading(reading, peripheralsConfig); // null over capacity
```

- A station is on one named printer at most; a station no printer serves refuses with `unavailable`.
- The buzzer is `ESC B n t`; a printer that does not know it prints silently.
- `bumpBarKeys` maps what the keypad types to `bump`, `recall`, `next`, `previous`, `select`.
- `ExitGateService` takes a `UsedReceiptStore`; only `memory` (one gate) ships, so a venue with several exits needs a
  shared driver before one receipt is refused at the second exit.

## Scales, self-checkout and drive-through lanes

```ts
export class PeripheralsConfig extends BasePeripheralsConfig {
  // memory is the only driver of each until a vendor's driver ships with its own ADR
  override scannerScale: DriverName<ScannerScale> = "memory";
  override baggingScale: DriverName<BaggingScale> = "memory";
  override labelScale: DriverName<LabelScale> = "memory";
  override driveThroughLane: DriverName<DriveThroughLane> = "memory";
}

// till: the scanner-scale streams the platter; a weighed line charges on a settled reading
const stop = scannerScale.onWeight((reading) => line.showWeight(reading));

// self-checkout: zero the bagging area at the start, compare each change with what was scanned (the product's rule)
await bagging.zero();
bagging.onWeight((reading) => lane.checkBag(reading));

// label scales: items and prices ahead of their effective time, one named scale at a time
const sent = await labelScales.sync("deli_1", items); // CapabilityResult<readonly string[]> (the codes taken)

// drive-through: the car sensor starts the order timer; the board confirms the order to the car
lanes.onCar((car) => car.isPresent && timers.startOrder(car.lane));
await lanes.confirm("lane_1", { lines, total: "SAR 36.00", message: null });

// a GS1-128 or DataBar code: GTIN, net weight (310n kg, 320n lb), price (392n, 393n with its ISO 4217 code)
parseGs1ElementString("]e00109501101530003" + "3103001250");
// { gtin: "09501101530003", weight: { value: "1.250", unit: "kg" }, price: null, elements, code }
```

- `ScannerScale` and `BaggingScale` read like `Scale` and add `zero()`; they are ports of their own so a self-checkout
  binds both. The tolerance, a mismatch and a typed manual weight are the product's rules, not this package's.
- `LabelScale` and `DriveThroughLane` name the scale or lane on every call (a store has several). A lane with no sensor
  sends no car events; the product starts its timers on order-taking instead. The board refuses with `window`, a
  label scale with `network`, the scales with `serial`.
- `parseGs1ElementString` reads the raw form (an optional AIM symbology identifier, GS separators) and the bracketed
  form. A wrong GTIN or SSCC check digit, an identifier it does not know, a bad length or a non-GS1 symbology
  identifier (`]E0`) parses to `null`. An in-store prefix-2x EAN-13 stays `parseEmbeddedBarcode`'s.

## The native Android till: Sunmi, PAX and iMin

The `./native` entry holds the drivers of the Android till on Sunmi, PAX and iMin terminals (ADR 0442 decision 4), one
vendor ADR each (0458 Sunmi, 0459 PAX, 0460 iMin). Each family drives the terminal's built-in printer, the drawer on
its drawer port and its built-in scanner behind the existing ports; the ports do not change.

| Driver name | `ReceiptPrinter`            | `CashDrawer`            | `BarcodeScanner`            | Expo module    |
| ----------- | --------------------------- | ----------------------- | --------------------------- | -------------- |
| `sunmi`     | `SunmiReceiptPrinterDriver` | `SunmiCashDrawerDriver` | `SunmiBarcodeScannerDriver` | `StackraSunmi` |
| `pax`       | `PaxReceiptPrinterDriver`   | `PaxCashDrawerDriver`   | `PaxBarcodeScannerDriver`   | `StackraPax`   |
| `imin`      | `IminReceiptPrinterDriver`  | `IminCashDrawerDriver`  | `IminBarcodeScannerDriver`  | `StackraImin`  |

```ts
export class PeripheralsConfig extends BasePeripheralsConfig {
  override printer: DriverName<ReceiptPrinter> = "sunmi";
  override drawer: DriverName<CashDrawer> = "sunmi";
  override scanner: DriverName<BarcodeScanner> = "sunmi";
}
```

- Each driver reads its family's Expo module from the app's modules registry when it runs, as the `external` customer
  display does, so the entry loads anywhere and a build without the module refuses (`print`, or `scanner` for the
  scanner) instead of crashing. Which families a build links is the runway's `device:<family>` capability.
- The module is a thin pass-through to the vendor SDK (`printerStatus`, `printLines`, `openDrawer`, the `onScan`
  event). Its Kotlin lives in the till app's `src/native-sources/<family>/` (ADR 0345 decision 6), not here. The JS
  driver reads the SDK's raw printer status against the family's ready codes, so the vendor knowledge is tested here.
- The printer checks it is ready before every print and kick. Lines go over as text with control characters dropped;
  other Unicode is kept, because the SDK draws the text (Arabic shaping is the SDK font's, and is checked at
  certification).
- The second screen stays the `external` customer display. Card terminals and label printers on these terminals are
  not built: an acquirer SDK is its own ADR (ADR 0442 decision 6).
- **Certification pending.** Built from the vendors' public SDK documents with tests that replay transcribed SDK
  answers (`src/native/__tests__/pos-device-sdk.fixture.ts`). Recordings from certified models (STA-739) replace
  them before a family ships.

## Targets and limits

Web APIs first, native modules only on evidence (ADR 0253 decisions 2 and 3). What each target can do today:

| Peripheral      | Desktop (Electron main, shipped)                                                                      | PWA and web (Chromium)                                                                         | Safari, Firefox, mobile  |
| --------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------ |
| Receipt printer | `escpos` over TCP or a device path; a USB printer on macOS needs a network address (no native module) | WebUSB can reach an ESC/POS printer's bulk endpoint behind `Capability.Usb`; not shipped       | no WebUSB: `memory` only |
| Cash drawer     | `printer_kick` through the bound printer                                                              | through a WebUSB printer, once that driver exists                                              | none                     |
| Barcode scanner | `hid`: keyboard-wedge keystrokes read from every window's `before-input-event`                        | a wedge scanner types into the focused field with no permission; WebHID (POS mode) not shipped | wedge typing only        |
| Scale           | none: a serial line needs a native module in main (ADR 0253 decision 3)                               | WebSerial behind `Capability.Serial`; not shipped                                              | none                     |

On the Android till (Sunmi, PAX, iMin) the receipt printer, drawer and scanner are the `./native` drivers above.

The browser drivers would live in a `./browser` entry, which this package does not have yet; they land with the first
web till that needs them, under the driver names above. In the Electron renderer, WebUSB, WebHID and WebSerial also
need main's device permission handlers (`DesktopConfig`). Receipts print printable ASCII only: Arabic and other scripts
need a raster image or a code-page table, which a preset adds when it prints them.

## Testing

```ts
import { MemoryReceiptPrinterDriver } from "@stackra/peripherals";

const printer = new MemoryReceiptPrinterDriver();
await new PrintReceiptBridge(printer).handle({ orderId: "ord_1", lines: ["Total 12.00"] });
expect(printer.printed).toHaveLength(1);
printer.isPresent = false; // every call now refuses with `unavailable`
```

`MemoryBarcodeScannerDriver#emit(code)` scans, `MemoryCashDrawerDriver#opened` counts opens and
`MemoryScaleDriver#reading` (`null` for no scale) sets the weight. `MemoryScannerScaleDriver#gross` and
`MemoryBaggingScaleDriver#gross` set what lies on the scale (net of `zero()`), `MemoryLabelScaleDriver#items(scale)`
and `#offline` show and break a scale's sync, and `MemoryDriveThroughLaneDriver#car(lane, isPresent)`, `#boards` and
`#offline` drive a lane.

Governing ADRs: 0253 (this package), 0339, 0429, 0449, 0250 (capabilities and refusals), 0251 (bridges and hardening), 0254 (desktop
release baseline), 0266, 0269, 0294 (decisions 4, 15 to 17, 19, 20, 26), 0127 2026-10-24 note.
