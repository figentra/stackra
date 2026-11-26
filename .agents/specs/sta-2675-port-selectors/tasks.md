# Tasks: two-driver ports are chosen by a config selector with a default

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2675

- [x] T001 the Database selector, with its test, in `packages/data/database/src/core/schemas/database-config-options.schema.ts` — covers: AC-001, AC-005, P-001, P-005 — route: spec-task
- [x] T002 the settings config with its two selectors, with its test, in `packages/state/settings/src/config/settings.config.ts` — covers: AC-002, AC-005, P-002, P-005 — route: spec-task
- [x] T003 the storage config with its selector, with its test, in `packages/data/storage/src/config/storage.config.ts` — covers: AC-003, AC-005, P-003, P-005 — route: spec-task
- [x] T004 the identity selectors, with their test, in `packages/security/identity/src/core/schemas/identity-options.schema.ts` — covers: AC-004, AC-005, P-004, P-005 — route: spec-task
- [x] T005 the regenerated manifests, the READMEs and the changeset in `.changeset/port-selectors.md` — covers: AC-001, AC-002, AC-003, AC-004 — route: spec-task — deps: T004
