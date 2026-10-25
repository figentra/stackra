# Tasks: `@stackra/gen` wave 2

**Input**: `.agents/specs/sta-348-gen/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-gen/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, LICENSE, CHANGELOG) in `packages/developer/gen` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US1] IR types, identity helpers, `buildManifest`, `checkIdentityLock`, `compareManifests`, `openApiOf` — covers: FR-003 — route: package — deps: T002
- [x] T004 [US2] `emitSchemas` (with the `{ input, output }` of actions and queries), `jsonSchemaOf`, `platformConstant` — covers: FR-004 — route: package — deps: T003
- [x] T005 [US3] `emitWiring`, `rootModuleOf`, `emitMemberModule`, `emitPackageEntries`, `emitRuntimeEntries`, `generateMember` — covers: FR-004 — route: package — deps: T004
- [x] T006 [US1, US2] Host seam (`openTsgoHost`, `openTs6Host`, `openHost`), `createSourceReader`, `readMemberFacts`, `readDependencyManifests`, `discoverMember`, `generate` — covers: FR-002 — route: package — deps: T005
- [x] T007 [US4] `classComponentsPlugin`, `compileClassComponents`, `classComponents`, the Metro transformer — covers: FR-005 — route: package — deps: T002
- [x] T008 [US5] `packages/developer/gen/src/testing` helpers — covers: FR-006, SC-001 — route: package — deps: T006
- [x] T009 Stand-in barrels for `.`, `packages/developer/gen/src/node`, `packages/developer/gen/src/testing`, `packages/developer/gen/src/metro-transformer` — covers: FR-001 — route: package — deps: T008
- [x] T010 Tests beside every subject, the barrel tests and the fixtures — covers: SC-002 — route: tests — deps: T009
- [x] T011 Changeset `.changeset/gen-package.md` — covers: SC-001 — route: package — deps: T009
- [ ] T012 Owner: add `typescript6: npm:typescript@6.0.3` to `catalog:tooling` — covers: FR-002 — route: dependencies
- [ ] T013 `pnpm install` to link the new member, then its tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T010, T012
- [x] T014 [US6] Entity IR read by discovery (`relationOf`, `entityOf`, `relation_decorator_missing`) and `emitEntities` — covers: FR-007 — route: package — deps: T006
- [x] T015 [US6] `emitRegistrations` (with `registerSequences`), `emitBoot`, `emitWebhooks`, `webhookIntegrations`, `registerChanges` in `emitSchemas` — covers: FR-008 — route: package — deps: T014
- [x] T016 [US6] Wiring bindings gen adds: `MODEL_TOKENS`, `PLATFORM_BINDINGS`, an Integration's runtime, the inbound route — covers: FR-009 — route: package — deps: T005
- [x] T017 [US6] Manifest integrations, sequences, blocks and routes with `integrationKey`, `webhookPath`, `sequenceKey`, `blockKey`, `routeKey`; the lock; `PUBLIC_ID_PREFIXES` and the prefix checks; `emitPrefixes` — covers: FR-010 — route: package — deps: T003
- [x] T018 [US6] `emitRoutes` (with `registerPanelPages`), `emitBlocks`, runtime entries loading them, `emitToolConfigs`, `generateMember` running every emitter — covers: FR-011 — route: package — deps: T017
- [x] T019 [US6] Tests beside every new emitter, helper and constant, the billing and web app IR fixtures, and the model discovery fixture — covers: FR-007, FR-008, FR-009, FR-010, FR-011 — route: tests — deps: T018
- [x] T020 [US6] README, AGENTS, spec, plan and changeset for the catch-up — covers: FR-011 — route: package — deps: T019
- [ ] T021 Run the catch-up tests and typecheck in the separate testing workflow — covers: FR-007, FR-008, FR-009, FR-010, FR-011 — route: tests — deps: T019
