# Specification: port `~key` brands name the member key

**Feature Branch**: `figentra/sta-1811-port-key-brands`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1811

**Clarifications status**: complete

**Input**: The STA-1810 investigation found six hand-written port brands that use the package folder's hyphenated
name where the member key is snake_case: `data-transfer.{ImportLedger,TabularReader,TabularWriter,WarehouseSink}`,
`market-packs.PackStore` and `native-spotlight.DeviceSearchIndex`. The committed manifests and the generated
`DriverRegistry` key them `data_transfer.*`, `market_packs.PackStore` and `native_spotlight.DeviceSearchIndex`, so
`DriverName<Port>` resolves to `never` for each.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/data/data-transfer` (four ports), `packages/data/documents` (`PdfTableWriter`
  restates the TabularWriter brand), `packages/foundation/market-packs` (one port), `packages/experience/native-spotlight`
  (one port and its type test)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (ADR 0294 decision 20: the port key is `<member>.<Port>`; this makes the brands match it)
- **New dependencies**: none
- **Deploy modes**: all, no change
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: lite
- **Change risk**: R1 (type-only brands)

## Requirements

- **FR-001** Each of the six brands is `<member key>.<Port>`, as the member's manifest keys it.
- **FR-002** `PdfTableWriter`'s restated brand and the native-spotlight type test follow.

## Status history

- 2026-11-01 → Clarified (STA-1810 finding)
