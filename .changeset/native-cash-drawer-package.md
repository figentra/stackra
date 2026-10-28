---
"@stackra/native-cash-drawer": minor
"@stackra/peripherals": minor
---

New `@stackra/native-cash-drawer` (ADR 0478): the `StackraCashDrawer` Expo module (Kotlin for the Sunmi and PAX drawer
ports; a Swift half that rejects, as iOS has no drawer port) with `PrinterKickCashDrawerDriver` (through the bound
receipt printer, probing it first), `SunmiCashDrawerDriver` and `PaxCashDrawerDriver` behind the unchanged `CashDrawer`
port, and a config plugin that links only the families the runway lists. `@stackra/peripherals`: `SunmiCashDrawerDriver`
and `PaxCashDrawerDriver` leave `@stackra/peripherals/native` for the new package (same names `sunmi` and `pax`);
import them from `@stackra/native-cash-drawer`. Certification pending (STA-739).
