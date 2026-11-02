---
"@stackra/gen": minor
---

An app that hosts `@stackra/panel` now composes the panel resources its dependencies record: its route tables register
the trees on native as well as the browser, and gen writes `#stackra/resources` (`Resources` and `resourceList`), each
resource's route constants with the operation refs its consumed services' clients export. One resource key from two
classes is refused (`resource_duplicate`), and so is a resource whose list query no consumed service exports
(`resource_list_unbound`). The walk over the dependencies' manifests is the shared `contributionsOf` step (STA-1947).
