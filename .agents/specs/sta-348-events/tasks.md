# Tasks: `@stackra/events` wave 2

**Input**: `.agents/specs/sta-348-events/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-events/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/foundation/events` — covers: FR-001, FR-006 — route: package — deps: T001
- [x] T003 [US3] `./contracts`: `EventOutbox`, `EventMeta`, `RecordedEvent` — covers: FR-003, FR-005 — route: package — deps: T002
- [x] T004 [US1] `Event`, `DomainEvent`, `IntegrationEvent`, `WebhookEvent`, `AnalyticsEvent`, `BroadcastAudience`, option types — covers: FR-002, FR-005 — route: package — deps: T003
- [x] T005 [US2] `Listener`, `ListenerContext`, `registerListeners`, `EventBus` — covers: FR-002, FR-007 — route: package — deps: T004
- [x] T006 [US3] `recordEvent`, `takeRecordedEvents` — covers: FR-005 — route: package — deps: T004
- [x] T007 [US4] `./testing`: plugin, `dispatch`, `drainEvents`, `drainOutbox`, `deliverRemoteEvent`, `OutboxFake`, `toEmit`, `toRecord` (lists and `run()` results) — covers: FR-004, FR-006 — route: package — deps: T005
- [x] T008 Stand-in barrels for the three entries — covers: FR-001 — route: package — deps: T007
- [x] T009 Tests beside every subject and the barrel tests — covers: SC-002, SC-003 — route: tests — deps: T008
- [x] T010 Changeset `.changeset/events-package.md` — covers: SC-001 — route: package — deps: T008
- [ ] T011 Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T009
