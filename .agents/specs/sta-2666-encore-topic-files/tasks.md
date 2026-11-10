# Tasks: gen's Encore topic files pass Encore's parser

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2666

- [x] T001 the events and queues emitters register publisher refs, with their tests and the golden files, in `packages/developer/gen/src/core/functions/emit-encore-events.function.ts`, `packages/developer/gen/src/core/functions/emit-encore-queues.function.ts`, `packages/developer/gen/src/core/functions/__tests__/emit-encore-events.function.test.ts`, `packages/developer/gen/src/core/functions/__tests__/emit-encore-queues.function.test.ts` — covers: AC-001, P-001 — route: spec-task
- [x] T002 the local broker message declaration and its imports, with the golden files, in `packages/developer/gen/src/core/functions/emit-encore-broker-message.function.ts`, `packages/developer/gen/src/core/functions/generate-member.function.ts` — covers: AC-002, P-002 — route: spec-task — deps: T001
- [x] T003 the drift test in `packages/developer/gen/src/core/functions/__tests__/emit-encore-broker-message.function.test.ts` — covers: AC-003, P-003 — route: spec-task — deps: T002
- [x] T004 the changeset in `.changeset/gen-encore-topic-files.md` — covers: AC-001, AC-002 — route: spec-task — deps: T003
