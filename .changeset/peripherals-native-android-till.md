---
"@stackra/peripherals": minor
---

New `./native` entry: the Sunmi, PAX and iMin drivers of the native Android till (ADR 0442 decision 4; vendor ADRs
0458, 0459 and 0460). `sunmi`, `pax` and `imin` are now driver names of `peripherals.printer`, `.drawer` and
`.scanner`, so `DriverName<ReceiptPrinter>`, `DriverName<CashDrawer>` and `DriverName<BarcodeScanner>` each gain the
three. Each driver reads its family's Expo module (`StackraSunmi`, `StackraPax`, `StackraImin`) at call time and
refuses where it is absent. Certification pending: built from public SDK documents with recorded-fixture tests
(batch stackra-50).
