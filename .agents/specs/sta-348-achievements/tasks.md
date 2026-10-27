# Tasks: `@stackra/achievements`

**Input**: `.agents/specs/sta-348-achievements/`

- [x] T001 Spec, plan and tasks — covers: SC-001 — route: spec-draft
- [x] T002 ADR 0368 (Proposed) in `apps/docs/src/docs/adr/` — covers: SC-001 — route: docs
- [x] T003 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, ORIGIN, LICENSE, CHANGELOG) — covers: FR-001 — route: package
- [x] T004 Contracts: `GrantRefusal`, `RecipientRef`, `AwardRecipient`, `VerifiedAward`, `CertificateFields` — covers: FR-003, FR-005, FR-006 — route: package
- [x] T005 Core: events with shipped schemas, two refusals, `checkGrant`, `verifyQr` — covers: FR-003, FR-006, FR-007 — route: package
- [x] T006 Node: models and `CreateAchievementsMigration` — covers: FR-002, FR-005 — route: package
- [x] T007 Node: `registerAwardRecipients`, `AwardKindService`, `AwardService` — covers: FR-002 to FR-007 — route: package
- [x] T008 Tests for every public symbol and each barrel — covers: SC-002 — route: tests
- [x] T009 Changeset `.changeset/achievements-package.md`; `oxfmt` and `oxlint` clean — covers: SC-001, SC-003 — route: package
- [ ] T010 Integrator: add `uqr` to the default catalog, install, add ADR 0368 to the index — route: integrator
- [ ] T011 Run tests, typecheck and build in the testing workflow — covers: SC-002 — route: tests
