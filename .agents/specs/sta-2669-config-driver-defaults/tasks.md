# Tasks: the signer and secret-store drivers are chosen by config

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2669

- [x] T001 the signer's driver field, its constants, type, the port's key and its test, in `packages/foundation/config/src/core/schemas/signer-options.schema.ts`, `packages/foundation/config/src/core/constants/signer-drivers.constant.ts`, `packages/foundation/contracts/src/core/ports/signer.port.ts`, `packages/foundation/config/src/config/__tests__/signer.config.test.ts` — covers: AC-001, AC-003, P-001, P-003 — route: spec-task
- [x] T002 the secrets config with its store field, constants, type, the port's key and its test, in `packages/foundation/config/src/config/secrets.config.ts`, `packages/foundation/config/src/core/schemas/secrets-options.schema.ts`, `packages/foundation/config/src/contracts/ports/secret-store.port.ts`, `packages/foundation/config/src/config/__tests__/secrets.config.test.ts` — covers: AC-002, AC-003, P-002, P-003 — route: spec-task — deps: T001
- [x] T003 the manifests, the README and the changeset in `packages/foundation/config/stackra.manifest.json`, `workers/edge/stackra.manifest.json`, `packages/foundation/config/README.md`, `.changeset/config-signer-driver-field.md` — covers: AC-001, AC-002 — route: spec-task — deps: T002
