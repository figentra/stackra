# Tasks: a prompt's eval dataset stays .eval.json

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2663

- [x] T001 the `MUST_STAY_JSON` entry and its test in `packages/developer/repo-checks/src/node/constants/must-stay-json.constant.ts`, `packages/developer/repo-checks/src/node/functions/__tests__/repository-checks.test.ts` — covers: AC-001, AC-002, P-001, P-002 — route: spec-task
- [x] T002 the changeset in `.changeset/repo-checks-eval-json.md` — covers: AC-001 — route: spec-task — deps: T001
