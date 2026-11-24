# Tasks: playground: regenerate the committed manifest and OpenAPI document after the API-area prefix

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2036

- [x] T001 regenerate the playground's contract with `stackra gen` and commit it, in `apps/playground/stackra.manifest.json` and `apps/playground/openapi.json` — covers: AC-001, AC-002, P-001 — route: spec-task
- [x] T002 prove the identity sets (13 actions, 9 events, 13 permissions, 42 errors, 7 models, 12 OpenAPI operation ids) are the same before and after, in `apps/playground/stackra.manifest.json` and `apps/playground/openapi.json` — covers: AC-003, P-003 — route: spec-task — deps: T001
- [x] T003 run `stackra gen` a second time in `apps/playground` and see no change to `apps/playground/stackra.manifest.json` or `apps/playground/openapi.json` — covers: AC-004, P-002 — route: spec-task — deps: T001
