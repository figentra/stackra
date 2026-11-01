---
"@stackra/data-transfer": patch
"@stackra/documents": patch
"@stackra/market-packs": patch
"@stackra/native-spotlight": patch
---

Six port `~key` brands name the member key (`data_transfer.TabularWriter`, `market_packs.PackStore`,
`native_spotlight.DeviceSearchIndex`, …) instead of the hyphenated folder name, so `DriverName<Port>` narrows to the
port's drivers instead of resolving to `never`.
