# Tasks: `@stackra/calendar`

**Input**: `.agents/specs/sta-348-calendar/`

- [x] T001 Spec, plan and tasks — covers: SC-001 — route: spec-draft
- [x] T002 Member files in `packages/foundation/calendar` (package.json, tsconfig, turbo.jsonc, stackra.config.ts, tool configs, README, AGENTS, LICENSE, CHANGELOG) — covers: FR-001 — route: package — deps: T001
- [x] T003 Enums `DayStatus`, `HolidayKind`, `LeapBirthday`, `UncertainDays` — covers: FR-006, FR-010 — route: package — deps: T002
- [x] T004 `BusinessCalendar$` schema and types — covers: FR-005, FR-007, FR-011 — route: package — deps: T003
- [x] T005 Day numbers, time zones, `instantOf`, `localDateOf` — covers: FR-004 — route: package — deps: T002
- [x] T006 `hijriOf`, `gregorianOf` — covers: FR-003 — route: package — deps: T005
- [x] T007 `dayStatus`, `addBusinessDays` — covers: FR-005, FR-006 — route: package — deps: T004, T006
- [x] T008 `openIntervals`, `addWorkingMinutes` — covers: FR-007 — route: package — deps: T007
- [x] T009 `occurrences` with RRULE parsing — covers: FR-008 — route: package — deps: T007
- [x] T010 `findSlots` — covers: FR-009 — route: package — deps: T005
- [x] T011 `ageOn` — covers: FR-010 — route: package — deps: T003
- [x] T012 Stand-in barrel and tests beside every subject — covers: FR-002, FR-012, SC-002 — route: tests — deps: T011
- [x] T013 Changeset `.changeset/calendar-package.md` and ADR 0366 — covers: SC-001 — route: package — deps: T012
- [ ] T014 Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T012
