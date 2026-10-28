---
"@stackra/outbox": minor
"@stackra/search": minor
"@stackra/privacy": minor
---

Erasure fan-out, P0 part (data-layer gap gov6, ADR 0189 decision 2). @stackra/outbox adds `OutboxDriver.holding(value)`
and `OutboxDriver.rewrite(id, data)` (memory and Postgres drivers; a custom driver must implement both) and
`redactSubjectMessages(driver, subject, fields)`, which nulls the named fields in every held message, due, retrying or
dead, whose payload names the subject. @stackra/search adds `SearchForgetService.forget(Model, ids)`, which drops rows
from the search index and, for a semantic model, the vector index, and `passageIdOf`. @stackra/privacy's erasure saga
gains a `redact` step before `shred` (its constructor now takes the `OutboxDriver`) and counts rewritten messages in
the receipt as `outbox.message`; the new `UnindexErasedSubjectListener` removes the subject's remaining rows from search
after `SubjectErased`.
