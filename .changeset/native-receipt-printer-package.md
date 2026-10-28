---
"@stackra/native-receipt-printer": minor
"@stackra/peripherals": minor
---

New `@stackra/native-receipt-printer` (ADR 0478): the `StackraReceiptPrinter` Expo module (Swift for Epson ePOS and
Star StarXpand, Kotlin for Epson, Star, Sunmi and PAX) with `EpsonReceiptPrinterDriver`, `StarReceiptPrinterDriver`,
`SunmiReceiptPrinterDriver` and `PaxReceiptPrinterDriver` behind the unchanged `ReceiptPrinter` port,
`kickThroughPrinter` for the drawer, and a config plugin that links only the vendor families the runway lists.
`@stackra/peripherals`: `epson` and `star` join the `peripherals.printer` driver names; `SunmiReceiptPrinterDriver` and
`PaxReceiptPrinterDriver` leave `@stackra/peripherals/native` for the new package (same names `sunmi` and `pax`);
import them from `@stackra/native-receipt-printer`. Certification pending (STA-739).
