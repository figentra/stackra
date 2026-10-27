---
"@stackra/fiscal": minor
"@stackra/data-transfer": minor
---

Memory drivers for the unit tier: `MemoryFiscalDriver` (key `memory`; seals hash over the previous hash, submit
accepts everything, `exportJournal` writes JSON lines) and `MemoryTabularReaderDriver` / `MemoryTabularWriterDriver`.
Both packages ship their `stackra.manifest.json`.
