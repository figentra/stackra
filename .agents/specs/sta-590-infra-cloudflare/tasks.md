# Tasks: `@stackra/infra-cloudflare`

**Input**: `.agents/specs/sta-590-infra-cloudflare/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-590-infra-cloudflare/` — covers: SC-003 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/infrastructure/infra-cloudflare` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US3] Enums, schemas, `parseEdge`, `parseCloudflareStack`, `rateLimitFor`, the error and types in `packages/infrastructure/infra-cloudflare/src/core/` — covers: FR-002, FR-003, FR-005 — route: infra — deps: T002
- [x] T004 [US2] `tunnelIngress` and `devPortsOf` in `packages/infrastructure/infra-cloudflare/src/core/functions/` — covers: FR-006 — route: infra — deps: T003
- [x] T005 [US1] `resolveRef`, `cloudflareZone`, `zoneEdge` and `r2Bucket` in `packages/infrastructure/infra-cloudflare/src/node/functions/` — covers: FR-004, FR-005, FR-008, FR-009 — route: infra — deps: T003
- [x] T006 [US2] `devTunnel` and `accessGate` in `packages/infrastructure/infra-cloudflare/src/node/functions/` — covers: FR-006, FR-007 — route: infra — deps: T004
- [x] T007 [US1] `cloudflareCoreStack` in `packages/infrastructure/infra-cloudflare/src/node/functions/` — covers: FR-004, FR-009 — route: infra — deps: T005, T006
- [x] T008 [US1, US2, US3] Tests beside every public symbol, the Pulumi programs under mocks (`packages/infrastructure/infra-cloudflare/src/**/__tests__/`) — covers: SC-001 — route: tests — deps: T007
- [x] T009 [US1] Changeset `.changeset/infra-cloudflare-package.md` — covers: SC-003 — route: package — deps: T007
- [ ] T010 [US1, US2, US3] Run the package's tests, typecheck and build in the separate testing workflow, once the `infra` catalog is installed — covers: SC-002 — route: tests — deps: T008
- [ ] T011 [US1] The owner's first `pulumi preview` of the Cloudflare stack in `figentra/infra` — covers: SC-003 — route: infra — deps: T010
