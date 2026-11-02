# Tasks: cross-app event relay (STA-1910)

**Input**: `.agents/specs/sta-1910-cross-app-event-relay/`

Small PRs in the plan's order, each with a changeset and verified on a testbed box.

## PR 1 · Spec, ADR note, manifest type and runway schema

- [x] T001 Spec, plan, tasks; ADR 0511 dated amendment note (producer key in the manifest's `relay` section, runway subscribers behind `SubscriberSource`, the inbox route, STA-1792 as the later replacement, envelope field names unchanged per plan F-2); one line on ADR 0141's 2026-11-01 note — covers: FR-004, FR-013, FR-016 — route: spec — deps: none
- [x] T002 [US4] `StackraManifest.relay` (keys and subscribers per environment) in `packages/foundation/contracts`, with tests and a changeset — covers: FR-016, FR-020 — route: contract — deps: T001
- [x] T003 [US1] Runway `events` block in `SERVICE_ENVIRONMENT_SCHEMA` and `schema/service.json` (signing key secret name, public keys, subscribers; an `https` inbox origin, or `http` to a loopback host), tests and a changeset — covers: FR-012, FR-015 — route: contract — deps: T001

## PR 2 · `@stackra/outbox`: delivery, relay and inbox

- [ ] T004 [US1] Ports `SubscriberSource`, `EventSigner`, `InboxVerifier`, `DeliveryDriver`; types and the cross-app envelope schema (`envelopeVersion`); `EventsRelayConfig`, which runway's deploy sets from the `events` block — covers: FR-004, FR-012 — route: contract — deps: T002, T003
- [ ] T005 [US2] Migration 0005 `outbox.deliveries`; `PostgresDeliveryDriver` and `MemoryDeliveryDriver` with fair `due`, retry, dead letter, list and replay; tests (Postgres on the testbed) — covers: FR-003, FR-014, SC-003 — route: package — deps: T004
- [ ] T006 [US1] [US5] `CrossAppFanOut` called from `OutboxRelayService.publish`, filtering by subscriber events, insert-or-ignore; no delivery for a sibling — covers: FR-001, FR-009, FR-012 — route: package — deps: T005
- [ ] T007 [US3] `Ed25519EventSigner` and `ContractInboxVerifier` (window, listed key, rotation), verification table tests — covers: FR-002, FR-005, FR-013, FR-017, FR-019, AC-003, AC-008 — route: security — deps: T004
- [ ] T008 [US2] `CrossAppRelayService`: own lock, per-subscriber fairness, timeout, no redirects, back-off and dead letter, 4xx handling; fake clock and transport tests — covers: FR-003, AC-005, SC-005 — route: package — deps: T006, T007
- [ ] T009 [US1] [US3] `RelayInboxService`: verify, parse, set `producer`, `InboxService.receive`, answers 204, 401, 422; repeat runs once — covers: FR-005, FR-006, FR-007, FR-008, AC-002, AC-007, SC-002 — route: security — deps: T007
- [ ] T010 [US2] Outbox README and AGENTS; changeset (the operator commands moved to T017) — covers: FR-014 — route: package — deps: T008, T009

## PR 3 · `@stackra/gen`: lift the refusal and generate the inbox

- [ ] T011 [US4] `build-manifest` writes the producer's `relay` section from `runway.yaml` — covers: FR-016 — route: compiler — deps: T002, T003
- [ ] T012 [US4] Lift `client_event_remote_transport`; register contract-only listeners for inbox delivery; `client_event_unknown` unchanged — covers: FR-010, FR-011 — route: compiler — deps: T009
- [ ] T013 [US4] `emit-inbox` (`InboundEventsController` on `/events/inbox`, the pinned producers' key table), only for a service with a contract-only listener — covers: FR-018, AC-009 — route: compiler — deps: T012
- [ ] T014 [US4] `emit-encore-inbox` (`api.raw`, exposed, no session auth, through `answerHttp`); the general adapter is STA-1955 — covers: FR-018 — route: compiler — deps: T013
- [ ] T015 [US4] `client_event_unsubscribed` warning — covers: FR-020 — route: compiler — deps: T011, T012
- [ ] T016 [US4] [US5] Goldens: cross-app consumer, cross-app producer, sibling consumer byte-identical; gen README; changeset — covers: FR-009, AC-004, AC-006, SC-006 — route: tests — deps: T013, T014, T015

## PR 4 · Docs and proof

- [ ] T019 [US1] Runway sets `config.outbox.cross_app` (key id, subscribers) from an environment's `events` block and maps its `signingKey` secret onto `STACKRA_EVENTS_SIGNING_KEY`, when it ships a service and in `stackra dev`, with `STACKRA_ENVIRONMENT` set in both (touches `stackra dev` and the ship path: the leader is told first) — covers: FR-012, FR-015 — route: contract — deps: T010
- [ ] T017 Commands `outbox:relay-deliveries` and `outbox:relay-replay` over `CrossAppRelayService.list` and `replay`; runbook `cross-app-event-relay`; AGENTS.md "Services"; ADR 0511 Enforcement lines for decisions 11 to 15 move to automated — covers: FR-014 — route: steward-docs — deps: T016
- [ ] T018 Testbed end to end per `quickstart.md` (pay to billing, repeat, forgery) and gen in figentra/billing and figentra/os scheduling-calendar, cited on the PR — covers: AC-001, AC-004, SC-001, SC-004 — route: tests — deps: T016
