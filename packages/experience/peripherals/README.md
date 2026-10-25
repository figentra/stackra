# @stackra/peripherals

Stackra peripherals: the point-of-sale hardware a client drives itself (ADR 0253). Four ports, `ReceiptPrinter`,
`CashDrawer`, `BarcodeScanner` and `Scale`, each a capability with a driver per target. A call that no device can
honour resolves a typed refusal (`unavailable`, `permission_denied`) in the `CapabilityResult` shape of
`@stackra/platform`, never an exception. Receipts are ESC/POS, the drawer kicks through the printer, and the scanner is
a keyboard-wedge HID device. A peripheral is hardware the client uses; a device that is a principal belongs to
`@stackra/devices` (ADR 0235).

**Tier:** `tier:lib` (`packages/experience/peripherals`). Entries `.`, `./contracts` and `./electron` (ADR 0127
2026-10-24 note: a runtime-target entry). Depends on `@stackra/platform` (capability codes, the result shape, the
`Bridge` kind), `@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/validation` and
`@stackra/errors`. Electron is an optional peer of `./electron`.

## What is here

| Entry         | Symbol                                                                                                              | Use                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `.`           | `PeripheralsConfig` (+ `PeripheralsConfig$`)                                                                        | the configuration (key `peripherals`): drivers, printer address, drawer pin, scan key gap |
| `.`           | `MemoryReceiptPrinterDriver`, `MemoryCashDrawerDriver`, `MemoryBarcodeScannerDriver`, `MemoryScaleDriver`           | the `memory` candidates: tests, web builds, a till with no hardware yet                   |
| `.`           | `PrinterUnavailableError`                                                                                           | the refusal the print bridge sends back when the printer refused (`printer_unavailable`)  |
| `./contracts` | `ReceiptPrinter`, `CashDrawer`, `BarcodeScanner`, `Scale`; `Receipt`, `PrintedReceipt`, `DrawerPin`, `ScaleReading` | the ports, injected by type (from here only)                                              |
| `./electron`  | `PrintReceiptBridge`                                                                                                | `peripherals.receipt.print`, the renderer's only way to the printer                       |
| `./electron`  | `EscposReceiptPrinterDriver`, `PrinterKickCashDrawerDriver`, `HidBarcodeScannerDriver`                              | the main-process drivers `escpos`, `printer_kick` and `hid`                               |

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

## Targets and limits

Web APIs first, native modules only on evidence (ADR 0253 decisions 2 and 3). What each target can do today:

| Peripheral      | Desktop (Electron main, shipped)                                                                      | PWA and web (Chromium)                                                                         | Safari, Firefox, mobile  |
| --------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------ |
| Receipt printer | `escpos` over TCP or a device path; a USB printer on macOS needs a network address (no native module) | WebUSB can reach an ESC/POS printer's bulk endpoint behind `Capability.Usb`; not shipped       | no WebUSB: `memory` only |
| Cash drawer     | `printer_kick` through the bound printer                                                              | through a WebUSB printer, once that driver exists                                              | none                     |
| Barcode scanner | `hid`: keyboard-wedge keystrokes read from every window's `before-input-event`                        | a wedge scanner types into the focused field with no permission; WebHID (POS mode) not shipped | wedge typing only        |
| Scale           | none: a serial line needs a native module in main (ADR 0253 decision 3)                               | WebSerial behind `Capability.Serial`; not shipped                                              | none                     |

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
`MemoryScaleDriver#reading` (`null` for no scale) sets the weight.

Governing ADRs: 0253 (this package), 0250 (capabilities and refusals), 0251 (bridges and hardening), 0254 (desktop
release baseline), 0266, 0269, 0294 (decisions 4, 15 to 17, 19, 20, 26), 0127 2026-10-24 note.
