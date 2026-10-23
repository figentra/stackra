# src/core

Isomorphic code of @stackra/ui (ADR 0294 decision 15): services, drivers, errors, functions, schemas and blocks.
It imports `contracts/` and nothing host-specific; `node/`, `react/` and `native/` build on it.

`core/` and `config/` together are the `.` entry, named by the stand-in barrel `index.ts` (`UiConfig`,
`directionOf`, `ICON_SIZES`, `initialsOf`) until `stackra gen` writes the entry barrels (STA-339).

Internal, not in the barrel (the web and native entries import them by path): `TONE_CLASS_NAME`, `STATUS_DOT_ROLE`
(the theme role of a status dot per tone) and `physicalPlacementOf` (a logical badge corner to HeroUI's physical one) and `AVATAR_SQUARE_CLASS_NAME` (the one class of a square avatar).
