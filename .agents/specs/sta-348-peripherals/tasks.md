# Tasks: `@stackra/peripherals` wave 4

**Input**: `.agents/specs/sta-348-peripherals/`

- [x] T001 [US3] Spec, plan and tasks in `.agents/specs/sta-348-peripherals/` — covers: SC-001 — route: spec-draft
- [x] T002 [US3] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/experience/peripherals` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US3] The four ports and their types in `packages/experience/peripherals/src/contracts/` — covers: FR-002, P-002 — route: package — deps: T002
- [x] T004 [US3] `PeripheralsConfig` in `packages/experience/peripherals/src/config/peripherals.config.ts`, with `PeripheralsOptions`, the shipped schema, the driver names and the registry entries in `packages/experience/peripherals/src/core/` — covers: FR-003, P-003 — route: package — deps: T003
- [x] T005 [US3] The four memory drivers in `packages/experience/peripherals/src/core/drivers/` and `PrinterUnavailableError` in `packages/experience/peripherals/src/core/errors/printer-unavailable.error.ts` — covers: FR-003, P-003 — route: package — deps: T004
- [x] T006 [US1] `escposReceipt` and `escposDrawerKick` in `packages/experience/peripherals/src/core/functions/` — covers: FR-005, P-005 — route: package — deps: T003
- [x] T007 [US1] `PrintReceiptBridge` in `packages/experience/peripherals/src/electron/bridges/print-receipt.bridge.ts` — covers: FR-004, P-004 — route: package — deps: T005
- [x] T008 [US2] `EscposReceiptPrinterDriver`, `PrinterKickCashDrawerDriver` and `HidBarcodeScannerDriver` in `packages/experience/peripherals/src/electron/drivers/` — covers: FR-005, FR-006, P-005, P-006 — route: package — deps: T006
- [x] T009 [US3] Stand-in barrels of the three entries and their export-list tests in `packages/experience/peripherals/src/` — covers: FR-001, FR-002, FR-003 — route: package — deps: T008
- [x] T010 [US3] Tests for every public symbol in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T009
- [x] T011 [US3] Changeset `.changeset/peripherals-package.md`; `oxfmt`, `oxlint` and `validate-repository` clean — covers: SC-001, SC-003 — route: package — deps: T010
- [ ] T012 [US3] Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T010
