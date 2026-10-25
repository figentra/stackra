---
"@stackra/assets": minor
---

Add build-time data assets (ADR 0234, 2026-10-24 note): `AssetEntry` takes an optional `hash` (SHA-256) and
`version`, `assets()` checks them, and `AssetLibrary.verify(entries)` and `AssetLibrary.json(entry)` refuse a data asset
whose shipped bytes differ with `AssetHashMismatchError`, so a module with changed data does not start.
