# Tasks: the consumer gate runs: the scaffold consumer, dated pins and a caller workflow

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2705

- [x] T001 the scaffold app and its setup rules in `packages/developer/cli/src/node/consumer-gate/functions/`, `packages/developer/cli/src/node/consumer-gate/constants/` and `packages/developer/cli/src/node/consumer-gate/types/`, with the matrix in `tools/consumer-gate/matrix.yaml` — covers: FR-1, AC-001, AC-002, AC-003, P-001, P-002 — route: spec-task
- [x] T002 the pin date and age in `packages/developer/cli/src/node/consumer-gate/functions/` and `--pin` in `packages/developer/cli/src/node/commands/consumer-gate.command.ts` — covers: FR-2, FR-3, AC-004, AC-005, P-003, P-004 — route: spec-task
- [x] T003 the caller workflow `.github/workflows/consumer-gate.yml` — covers: FR-4, AC-006, P-005 — route: spec-task
- [x] T004 the fixture in `tools/consumer-gate/scaffold-fixture/` and the failure lines in `packages/developer/cli/src/node/consumer-gate/functions/` — covers: FR-5, AC-007, P-006 — route: spec-task
- [x] T005 the docs: `apps/docs/src/docs/runbooks/release.mdx`, `packages/developer/cli/README.md`, `.github/workflows/README.md`, `.agents/specs/sta-1813-product-gate/spec.md` and `.changeset/consumer-gate-scaffold-runs.md` — covers: AC-004, AC-006 — route: spec-task
