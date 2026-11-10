---
"@stackra/gen": patch
---

A service's generated wiring binds the services its generated boot resolves. For a service that declares
`@stackra/outbox`, boot gets `OutboxWriterService`, `OutboxRelayService`, `InboxService` and `EventBus` from the
container (and `SegmentService`, `AutomationService` or `QueueWorkerService` for segments, workflow or queue), but
nothing injected them, so the wiring had no row and boot stopped at "Nothing binds OutboxWriterService". Each is now
bound with its dependencies from its package's manifest. Regenerate (`stackra gen`).
