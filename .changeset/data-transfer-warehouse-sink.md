---
"@stackra/data-transfer": minor
---

Warehouse sink (ADR 0163 decision 5 and ADR 0190 decision 3, amended 2026-10-29). New `WarehouseSink` port with
`WarehouseBatch` and `WarehouseWriteOptions` in `./contracts`; `WarehouseChangeSink` reads the retained outbox change
log from its own cursor and writes one batch per model, scope and UTC day (`sync`, `replay`); the `parquet` driver
`ParquetWarehouseSinkDriver` writes each batch to a `FileSystem` disk in the Hive layout `scope=/model=/dt=`. New
dependency-free `ParquetWriterDriver` (`TabularWriter`, uncompressed, row groups of `TabularWriteOptions.rowGroupRows`)
for one-off exports, and `warehouseBatches`, `warehousePath` and `warehouseSheet`.
