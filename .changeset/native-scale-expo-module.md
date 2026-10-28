---
"@stackra/native-scale": minor
---

New package (ADR 0478, STA-1531): the `StackraNativeScale` Expo module behind `@stackra/peripherals`' unchanged `Scale`
port, with `MtSicsScaleDriver` (Mettler Toledo MT-SICS) and `ContinuousAsciiScaleDriver` (the A&D standard format
stream) over Bluetooth LE, Bluetooth SPP and USB serial, `frame()` for the full legal-for-trade reading (unit, stable,
net or gross, tare), `NativeScaleConfig` with the `SCALE_PROTOCOLS` pack, the Swift and Kotlin byte links, and the
config plugin that keeps only the transports an app lists.
