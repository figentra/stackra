# Tasks: release: the 0.33.0 set in one merge

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2685

- [x] T001 merge the nine branches in order with `chore: merge <branch>` commits, and add this folder in `.agents/specs/sta-2685-release-0-33-0-set/` — covers: AC-001, P-001 — route: spec-task
- [x] T002 one Testbed gate dry-run, then the pull request with the nine heads and results — covers: AC-002, AC-003, P-002 — route: spec-task — deps: T001
