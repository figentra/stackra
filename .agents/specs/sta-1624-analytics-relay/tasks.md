# Tasks: analytics relay (STA-1624)

**Input**: `.agents/specs/sta-1624-analytics-relay/`

- [x] T001 Spec, plan, tasks and ADR 0483 — covers: SC-001 — route: spec
- [x] T002 [US4] `AnalyticsContext.device`, delivery schema, contracts test in `packages/cross-cutting/analytics/src/contracts` — covers: FR-003 — route: contract — deps: T001
- [x] T003 [US1] `RelayAnalyticsDriver` (core and native), `relay` driver name, `ANALYTICS_INGEST_PATH`, tests — covers: FR-001, FR-002, SC-001 — route: contract — deps: T002
- [x] T004 [US2] [US3] `IngestAnalyticsBatchAction`, schemas, `AnalyticsBatchAccepted`, `FanOutAnalyticsListener`, tests — covers: FR-004, FR-005, FR-006, SC-002, SC-003 — route: contract — deps: T003
- [x] T005 [US4] PostHog device mapping and GeoIP off for relayed batches, README, AGENTS, changeset — covers: FR-007 — route: steward-docs — deps: T004
- [ ] T006 Tests, typecheck, build and validate on ci-box (stackra-f4) — covers: SC-001, SC-002, SC-003 — route: tests — deps: T005
