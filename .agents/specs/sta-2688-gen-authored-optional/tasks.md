# Tasks: gen reads its own entities file as generated, not as an authored `[OptionalProps]`

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2688

- [x] T001 the authored check skips gen's entities file, with the fixture test, in `packages/developer/gen/src/node/functions/create-source-reader.function.ts`, `packages/developer/gen/src/node/functions/__tests__/create-source-reader.function.test.ts` — covers: AC-001, AC-002, P-001, P-002 — route: spec-task
- [x] T002 the changeset in `.changeset/gen-entities-file-not-authored.md` — covers: AC-001 — route: spec-task — deps: T001
