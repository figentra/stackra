---
"@stackra/panel": minor
---

Add the generic resource pages to `@stackra/panel/react` (stackra-220): `ResourceListPage` (the recorded columns, sort,
filters and search through `@stackra/ui`'s `FilterBar`, cursor pagination, row actions and the bulk bar fanned out per
record), `ResourceViewPage` (the infolist's entries and sections, the header actions run through the action runner,
and the relation managers), `ResourceFormPage` (Create and Edit from the recorded form fields or the action input's
own keys, validated by the input schema, with the server's field errors on their fields) and `RelationManager`.
`registerPanelPages()` now also registers them as navigation's `resource` page, so every `toResource` route has a page
with no extra code. `registerResources(trees)` (in `.`) hands the generated resource trees to the pages; a resource
with no registered tree shows the row's, record's and input's own keys. New `panel::resources.*` texts in all seven
locales.
