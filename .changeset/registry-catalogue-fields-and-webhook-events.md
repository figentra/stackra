---
"@stackra/registry": minor
---

`CatalogueManifest` now declares the catalogue fields a registry stores: a module's `enhances`, `intents` and
`entitlement`, an action's `tool` (gen's `{ name, default, hints }` or `true`) and `toolOff`, and an event's `webhook`,
`dataClasses` (`DataClassification` codes) and `thinFields`. New `deliverableEvents(manifest, previous?)` returns the
webhook event catalogue rows (`DeliverableEventRow`, `DeliverablePayload` thin or full) to register at manifest
publish, with withdrawn rows for opt-ins a release dropped.
