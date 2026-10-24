---
"@stackra/ui": minor
---

Add the wave 5 data primitives to `./react` (HeroUI v3) and `./native` (HeroUI Native, adapted where it has none), with
their contract props in `./contracts`: `Table`, `List` with `ListItem`, `PropertyList`, `Tabs`, `Accordion`,
`CursorPagination`, `Breadcrumbs`, `EmptyState`, `ErrorState` and `PageSkeleton`. Collections take `items` with string
ids, report a selection as a list of ids, a sort as a column and a direction, and ask for more through `onLoadMore`.
The state components carry no copy of their own. The kit now registers the `chevron-left` and `chevron-right` icons
itself, and on native the `check` icon too.
