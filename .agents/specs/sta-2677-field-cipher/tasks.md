# Tasks: a service with encrypted fields binds FieldCipher over its KeyProvider

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2677

- [x] T001 the shared helper, read by the boot, in `packages/developer/gen/src/core/functions/has-encrypted-fields.function.ts`, `packages/developer/gen/src/core/functions/emit-boot.function.ts` — covers: AC-003, P-003 — route: spec-task
- [x] T002 the cipher driver table and the KeyProvider worklist entry, with the wiring test, in `packages/developer/gen/src/core/functions/emit-wiring.function.ts`, `packages/developer/gen/src/core/functions/__tests__/emit-wiring.function.test.ts` — covers: AC-001, AC-002, P-001, P-002 — route: spec-task — deps: T001
- [x] T003 the changeset in `.changeset/gen-field-cipher.md` — covers: AC-001 — route: spec-task — deps: T002
