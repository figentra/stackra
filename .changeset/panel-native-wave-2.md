---
"@stackra/clients": minor
"@stackra/panel": minor
---

The panel's generic resource pages on React Native. `@stackra/clients/native` is a new entry with the native data
hooks: `useQuery`, which refetches a stale answer when the app returns to the foreground, and `useAction`, the same
action hook as on the web. `@stackra/panel/native` adds `ResourceListPage`, `ResourceViewPage`, `ResourceFormPage` and
`ActionInputModal` with the web pages' props: the list with search, filters, sort, cursor paging, views, row and bulk
actions and pull to refresh; the record with its entries and sections; the Create and Edit form drawn from the action's
input and checked by its schema; and the action form for an input that needs more than the record id. Every run goes
through a native action runner with the declared confirmation and toasts. Each page takes the resource, and a View or
Edit page the record id, from the host screen until gen registers resource screens on native. The showcase lists the
four for native.
