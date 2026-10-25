# Tasks: `@stackra/devices` wave 3

**Input**: `.agents/specs/sta-348-devices/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-devices/` — covers: SC-001, SC-002 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/runtime/devices` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US1] [US2] Ports, `CommandStatus` and the wire types in `packages/runtime/devices/src/contracts/` — covers: FR-002, FR-005 — route: package — deps: T002
- [x] T004 [US4] `DevicesOptions`, `DEVICES_CONFIG_SCHEMA`, `DevicesConfig` — covers: FR-003 — route: package — deps: T002
- [x] T005 [US3] `DeviceUnauthorizedError`, `DeviceHubRefusedError`, `hubSender` — covers: FR-004, FR-005 — route: package — deps: T004
- [x] T006 [US1] [US2] `DEVICE_HUB_PATHS`, `DEVICE_COMMAND_LIST_SCHEMA`, `HttpDeviceTelemetryDriver`, `HttpDeviceCommandsDriver` — covers: FR-004, FR-006 — route: package — deps: T003, T005
- [x] T007 Stand-in barrels for `.` and `packages/runtime/devices/src/contracts` — covers: FR-001, FR-002, FR-003 — route: package — deps: T006
- [x] T008 Tests beside every subject and the barrel tests — covers: SC-003 — route: tests — deps: T007
- [x] T009 Changeset `.changeset/devices-package.md` — covers: SC-002 — route: package — deps: T007
- [x] T011 `DeviceIdentity` port in `packages/runtime/devices/src/contracts/ports/`, with its test and the barrel row — covers: FR-007, P-007 — route: package — deps: T007
- [x] T012 `./node` entry (package.json, tsdown, barrel and its test) with `DeviceAcknowledgedQuery`, `DeviceAcknowledgedInput`, `DeviceAcknowledgedOutput` and their tests; `@stackra/actions` dependency; README, AGENTS, changeset (STA-489) — covers: FR-001, FR-008, P-001, P-008 — route: package — deps: T011
- [ ] T010 `pnpm install` to link the new member, then its tests, typecheck and build in the separate testing workflow — covers: SC-003, SC-004 — route: tests — deps: T008
