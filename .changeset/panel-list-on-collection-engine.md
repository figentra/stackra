---
"@stackra/panel": minor
---

The List page and relation tables run on `@stackra/ui`'s `useCollection` engine (ADR 0505): the search, filter, sort,
cursor pages and selection live in the engine, the declared filters come from the columns (an enum as a choice of
several codes, sent as a list), and the saved and preset views are one list's engine views drawn as tabs, so a view's
group and totals are kept instead of dropped. `SavedViewTabs` now takes `{ collection, label }` and draws
`SavedViews variant="tabs"`; `ResourceTable` takes `views` and `presets` instead of one `view` or `preset`.

The advanced filter editor's conditions reach the server too, each in its `TableFilter` wire form (equals and any of
as a list, comparisons, contains, between as a range, before and after, empty and not empty), one per key from a
filter that matches all; an any-match filter, a nested group, "does not contain" and "is none of" are not sent.
Those it cannot send are marked: `listFiltersOf` returns `{ values, unsent }`, and the list's filter bar draws the
unsent conditions as warning chips (`unappliedIds`).
