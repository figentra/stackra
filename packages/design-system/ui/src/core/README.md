# src/core

Isomorphic code of @stackra/ui (ADR 0294 decision 15): services, drivers, errors, functions, schemas and blocks.
It imports `contracts/` and nothing host-specific; `node/`, `react/` and `native/` build on it.

`core/` and `config/` together are the `.` entry, named by the stand-in barrel `index.ts` (`UiConfig`,
`directionOf`, `ICON_SIZES`) until `stackra gen` writes the entry barrels (STA-339).
