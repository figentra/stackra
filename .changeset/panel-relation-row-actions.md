---
"@stackra/panel": minor
---

A relation manager takes record actions for its rows (`r.table(Query, columns, { actions: [...] })`): each runs with the
row's id under the related model's id key and the relation's bound inputs filled in (opening the action input modal when
it takes more), so a child-keyed action such as releasing an order's hold sits on the parent's View page.
