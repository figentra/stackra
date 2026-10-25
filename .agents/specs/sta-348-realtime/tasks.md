# Tasks: `@stackra/realtime` wave 3

**Spec**: `.agents/specs/sta-348-realtime/spec.md` · **Plan**: `.agents/specs/sta-348-realtime/plan.md`

- [x] T001 Member files: `package.json` (four entries, catalog and workspace versions), `tsconfig.json` (`decorators-react`), `turbo.jsonc` (`tier:lib`), `stackra.config.ts`, `tsdown.config.ts`, `vitest.config.ts`, README, AGENTS, LICENSE, CHANGELOG — covers: FR-001 — route: package
- [x] T002 `packages/runtime/realtime/src/contracts`: `RealtimeDriver`, `RealtimeTransport` and the message, broadcast, session, target and link types, with tests — covers: FR-002 — route: package — deps: T001
- [x] T003 Config: `RealtimeOptions`, `REALTIME_CONFIG_SCHEMA` (`RealtimeConfig$`), `RealtimeConfig`, with tests restating the template's mobile and commerce overrides and their generated extends — covers: FR-002 — route: package — deps: T001
- [x] T004 Core: `RealtimeStatus`, `REALTIME_PATH`, the driver-name augmentations, `decodeMessage`, `broadcastChannel`, `mayReceive`, `backoffDelay`, `realtimeUrl`, with tests — covers: FR-002, FR-004 — route: package — deps: T001
- [x] T005 Server: `RealtimeHub`, `RealtimeBroadcaster`, and the `memory`, `sse` and `websocket` drivers, with tests — covers: FR-003, FR-004, FR-005 — route: package — deps: T002, T004
- [x] T006 Client: `RealtimeConnection`, and the `websocket` (with SSE fallback) and `memory` transports, with tests — covers: FR-003, FR-005 — route: package — deps: T002, T004
- [x] T007 `packages/runtime/realtime/src/react`: `useRealtimeConnection`, `useSubscription`, with jsdom tests — covers: FR-002 — route: package — deps: T006
- [x] T008 `packages/runtime/realtime/src/testing`: `RealtimeFake`, `fakeRealtime`, with tests — covers: FR-002 — route: package — deps: T005, T006
- [x] T009 Barrel tests for the four entries; changeset — covers: FR-001, FR-005, SC-001 — route: tests — deps: T007, T008
- [x] T010 Format and lint the package — covers: SC-003 — route: package — deps: T009
- [x] T012 `liveQueryRoutes` and `LiveQueryRefresh` (STA-489): the replica and live-query refresh routes, with tests, the barrel rows, README, AGENTS and changeset — covers: FR-006, P-006 — route: package — deps: T005
- [ ] T011 Run the tests, typecheck and build (separate testing workflow) — covers: SC-002 — route: tests — deps: T010
