---
"@stackra/peripherals": minor
---

The `ScannerScale` and `BaggingScale` ports (read, stream, zero) for tills and self-checkout, the `LabelScale` item and
price sync port, and the `DriveThroughLane` port (car sensor, order confirm board), each with its `memory` driver and a
`PeripheralsConfig` driver field; `parseGs1ElementString` reads GS1-128 and DataBar codes by application identifier
(GTIN, net weight 310n/320n, price 392n/393n) on top of the GS1 check digit (STA-965).
