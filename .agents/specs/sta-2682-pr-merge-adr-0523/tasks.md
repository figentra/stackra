# Tasks: pr-merge: the gate and the ruleset are the merge condition (ADR 0523)

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2682

- [x] T001 the merge condition and its tests in `tools/scripts/pr-merge.mjs`, `tools/scripts/__tests__/pr-merge.test.mjs` — covers: AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, P-001, P-002, P-003 — route: spec-task
- [x] T002 the retired review mode's message in `tools/scripts/bot-gh.mjs` — covers: AC-005 — route: spec-task
- [x] T003 the ADR 0119 note and the README row in `apps/docs/src/docs/adr/0119-merge-policy-and-release-authority.mdx`, `apps/docs/src/docs/adr/index.mdx`, `tools/scripts/README.md` — covers: AC-005 — route: spec-task — deps: T001
