# Tasks: the wiring binds the services the generated boot resolves

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2674

- [x] T001 the boot services constant and the wiring worklist rows, with the emitter test, in `packages/developer/gen/src/core/constants/boot-services.constant.ts`, `packages/developer/gen/src/core/functions/emit-wiring.function.ts`, `packages/developer/gen/src/core/functions/__tests__/emit-wiring.function.test.ts` — covers: AC-001, P-001 — route: spec-task
- [x] T002 the regenerated golden files, with the cross-app-consumer catalogue declaring its database, in `packages/developer/gen/__golden__/cross-app-consumer/input/services/catalogue/package.json.golden` — covers: AC-002, P-002 — route: spec-task — deps: T001
- [x] T003 the changeset in `.changeset/gen-wiring-binds-boot.md` — covers: AC-001 — route: spec-task — deps: T002
