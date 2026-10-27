---
"@stackra/actions": minor
---

Add the request origin: `CallOptions.origin` (`CallOrigin` with a `CallOriginKind` of `storefront`, `console`,
`api_key` or `agent`, from `./contracts`), which the pipeline carries to the call descriptor, the audit entry and
`ctx.origin`; `AuditEntryRecorded` gains optional `originKind` and `originId`. Add `ctx.publish(event)`, which writes an integration event no model owns through the `EventOutbox` in the
action's unit of work. Add `ReplicaChange.cascade`: a change stamped above a reader's scope node reaches it on an
incremental refresh (a lot recall), and the memory replica log honours it. `fakeActionContext` records published events.
