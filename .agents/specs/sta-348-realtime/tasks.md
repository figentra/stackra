# Tasks: `@stackra/realtime` wave 3

**Spec**: `.agents/specs/sta-348-realtime/spec.md` · **Plan**: `.agents/specs/sta-348-realtime/plan.md`

- [x] T001 Member files: `package.json` (four entries, catalog and workspace versions), `tsconfig.json`
      (`decorators-react`), `turbo.jsonc` (`tier:lib`), `stackra.config.ts`, `tsdown.config.ts`, `vitest.config.ts`,
      README, AGENTS, LICENSE, CHANGELOG
- [x] T002 `./contracts`: `RealtimeDriver`, `RealtimeTransport` and the message, broadcast, session, target and link
      types, with tests
- [x] T003 Config: `RealtimeOptions`, `REALTIME_CONFIG_SCHEMA` (`RealtimeConfig$`), `RealtimeConfig`, with tests
      restating the template's mobile and commerce overrides and their generated extends
- [x] T004 Core: `RealtimeStatus`, `REALTIME_PATH`, the driver-name augmentations, `decodeMessage`,
      `broadcastChannel`, `mayReceive`, `backoffDelay`, `realtimeUrl`, with tests
- [x] T005 Server: `RealtimeHub`, `RealtimeBroadcaster`, and the `memory`, `sse` and `websocket` drivers, with tests
- [x] T006 Client: `RealtimeConnection`, and the `websocket` (with SSE fallback) and `memory` transports, with tests
- [x] T007 `./react`: `useRealtimeConnection`, `useSubscription`, with jsdom tests
- [x] T008 `./testing`: `RealtimeFake`, `fakeRealtime`, with tests
- [x] T009 Barrel tests for the four entries; changeset
- [x] T010 Format and lint the package
- [ ] T011 Run the tests, typecheck and build (separate testing workflow)
