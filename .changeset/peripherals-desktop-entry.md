---
"@stackra/peripherals": minor
---

Rename the `./electron` entry to `./desktop` (ADR 0345 decision 9): `PrintReceiptBridge`, `EscposReceiptPrinterDriver`,
`PrinterKickCashDrawerDriver` and `HidBarcodeScannerDriver` keep their names, so only the import path changes
(`@stackra/peripherals/desktop`). The `Memory*Driver` classes stay in `.` as the default drivers.
