# Tasks: release: the 0.33.1 boot set in one merge

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2690

- [x] T001 merge the boot drafts in stack order, resolving the conflicts once, in `packages/developer/gen/src/core/functions/__tests__/emit-wiring.function.test.ts` and the files tasks T002 on name — covers: AC-001, P-001 — route: spec-task
- [x] T002 one Testbed gate dry-run, then the pull request with the heads and results, recorded in `.agents/specs/sta-2690-release-0-33-1-boot/spec.md` — covers: AC-002, P-002 — route: spec-task — deps: T001
