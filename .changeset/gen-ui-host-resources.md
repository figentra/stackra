---
"@stackra/gen": minor
---

An app that hosts `@stackra/panel` now composes the panel resources its dependencies record: its route tables register
the trees on native as well as the browser, and gen writes `#stackra/resources` (`Resources` and `resourceList`), each
resource's route constants with the operation refs its consumed services' clients export. One resource key from two
classes is refused (`resource_duplicate`). A page whose operation no consumed service's client exports gets no route
and is listed with its reason in `unboundOperations`; a `true` list or get waits on STA-1971. The walk over the dependencies' manifests is the shared `contributionsOf` step (STA-1947).
