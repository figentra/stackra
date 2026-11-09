---
"@stackra/versioning": minor
---

`serveVersioned` answers a call in its dated version: the `Stackra-Version` header, else a key's pin, else the latest served date, with the output downgraded through the registered dated changes and `Stackra-Version`, `Deprecation`, `Sunset` and `Vary` set. `resolveVersion` takes `required`, which refuses a key caller that names no version with the new `VersionRequiredError` (`version_required`); `applyVersionHeaders` also writes `Stackra-Version`; `VersioningConfig` (key `versioning`, `supported` dates) is empty, and so dormant, by default.
