---
"@stackra/skills": minor
---

Add the `./contracts` entry for Stackra registry items (ADR 0453 decision 11, STA-1336): `StackraKind` (`package`,
`skill`, `agent`, `mcp`, `plugin`), `StackraManifest` (the `stackra` field), `CatalogueItem` and `CataloguePage` (the
catalogue API), `ItemsLock` and `ItemsLockEntry` (`stackra-items.lock.yaml`), their zod 4 schemas and
`ITEM_PACKAGE_NAME_PATTERN` (`@<scope>/<kind>-<name>`).
