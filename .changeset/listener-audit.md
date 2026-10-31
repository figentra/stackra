---
"@stackra/events": minor
"@stackra/actions": minor
"@stackra/outbox": patch
---

Listeners are audited like actions. With a bound `ListenerAuditTrail` (`@stackra/events/contracts`), every listener delivery that ended writes one entry: the system actor `sys_listener` that handled it, the event's id as correlation, the event's actor as `causedBy`, and what the listener added with the new `ctx.audit(fields)` (never a classified value), inside the delivery's transaction. `@stackra/actions` ships `OutboxListenerAuditTrailDriver`, which writes it as the same `audit_entry.recorded` event an action call's entry is (`key: listener:<Listener>`).
