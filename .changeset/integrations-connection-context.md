---
"@stackra/integrations": minor
---

Add the `./contracts` entry with the `ConnectionContext` port, which moves there from `.` (ADR 0294 decision 15).
`ConnectionStore` and `ConnectionHost` stay in `.`. Add `RequestConnectionContextDriver`, the `request`
`ConnectionContext`: the running call's scope and the user it acts for (`actor.onBehalfOf ?? actor` when that is a
user), read from `@stackra/actions`' `RequestContext`; undefined outside a call.
