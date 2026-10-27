---
"@stackra/peripherals": minor
---

Named kitchen ticket printers (`PeripheralsConfig.kitchenPrinters`: address, stations, buzzer) with the `escpos`
`KitchenPrinter` driver (raster tickets for Arabic, `ESC B n t` buzzer) and the `peripherals.kitchen.print` bridge; the
`hid` and `memory` `BumpBar` drivers with a configurable key map (`bumpBarKeys`); scale presets (`scalePresets`,
`scalePreset`, `retail` and `precision`) applied by `fitScaleReading`; the `UsedReceiptStore` port with its `memory`
driver, now a dependency of `ExitGateService` (constructor gains a fourth parameter) and a new `store` exit reason
(STA-925, ADR 0449).
