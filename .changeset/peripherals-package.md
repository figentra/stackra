---
"@stackra/peripherals": minor
---

Add `@stackra/peripherals`, the point-of-sale peripherals of ADR 0253: the `ReceiptPrinter`, `CashDrawer`,
`BarcodeScanner` and `Scale` ports in `./contracts`, whose calls resolve a typed refusal when no device answers;
`PeripheralsConfig` (key `peripherals`) with its shipped schema, four memory drivers and `PrinterUnavailableError` in
`.`; and in `./electron` the `PrintReceiptBridge` (`peripherals.receipt.print`) with the main-process drivers
`EscposReceiptPrinterDriver` (ESC/POS over TCP or a device path), `PrinterKickCashDrawerDriver` (the drawer kicks
through the printer) and `HidBarcodeScannerDriver` (keyboard-wedge scans read with no native module).
