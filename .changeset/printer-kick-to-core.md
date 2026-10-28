---
"@stackra/peripherals": minor
"@stackra/native-cash-drawer": minor
---

`PrinterKickCashDrawerDriver` (`printer_kick`) moves from `@stackra/peripherals/desktop` to `@stackra/peripherals`, so
desktop and Expo apps share one driver, and it now probes the printer before the pulse (ADR 0458 decision 3).
`@stackra/native-cash-drawer` drops its copy and its `@stackra/native-receipt-printer` dependency (ADR 0478 decision 5).
