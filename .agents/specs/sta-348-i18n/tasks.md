# Tasks: `@stackra/i18n` wave 2

**Input**: `.agents/specs/sta-348-i18n/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-i18n/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/foundation/i18n` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US1] `Locale`, `NumberingSystem`, `LocaleUrlStrategy` — covers: FR-004 — route: package — deps: T002
- [x] T004 [US1] `I18nOptions`, `I18nConfig$`, `I18nConfig` — covers: FR-005 — route: package — deps: T003
- [x] T005 [US2] `keys`, `mergeCatalogues`, `formatMessage`, `intlLocale`, `I18nKey`, `LoadCatalogue` — covers: FR-002, FR-006, P-001, P-002 — route: package — deps: T003
- [x] T006 [US3] `I18nProvider` and the six hooks — covers: FR-003, FR-006, FR-007 — route: package — deps: T004, T005
- [x] T007 Stand-in barrels `packages/foundation/i18n/src/core/index.ts`, `packages/foundation/i18n/src/react/index.ts` — covers: FR-002, FR-003 — route: package — deps: T006
- [x] T008 Tests beside every subject and both barrel tests — covers: SC-002, SC-003, FR-008 — route: tests — deps: T007
- [x] T009 Changeset `.changeset/i18n-package.md` — covers: SC-001 — route: package — deps: T007
- [x] T012 [US1] Move the cross-field rules off `I18nConfig$` into `checkI18nOptions` (gen extends the shipped schema) — covers: FR-005 — route: package — deps: T004
- [ ] T010 Owner: add the `intl-messageformat` pin to the default catalog, then `pnpm install` — covers: FR-001 — route: dependencies — deps: T002
- [ ] T011 Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T008, T010
