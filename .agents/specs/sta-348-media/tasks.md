# Tasks: `@stackra/media` wave 7

**Input**: `.agents/specs/sta-348-media/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-media/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/data/media` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US1] `MediaDisk` and its types in `packages/data/media/src/contracts` — covers: FR-003 — route: package — deps: T002
- [x] T004 [US1] `Bucket`, the enums, `Upload`, the refusals, the bucket registry and path helpers — covers: FR-002 — route: package — deps: T003
- [x] T005 [US1] `MediaLibrary`, `MediaConfig` and the memory disk — covers: FR-002, FR-006 — route: package — deps: T004
- [x] T006 [US2] `Uploader` with its memory and HTTP drivers; the S3 disk and the `upload.create` action in `packages/data/media/src/node` — covers: FR-003, FR-006 — route: package — deps: T005
- [x] T007 [US2] [US3] `useUpload` and `useImageVariant` in `packages/data/media/src/react` — covers: FR-004, SC-001 — route: package — deps: T006
- [x] T008 [US1] `fakeUpload` in `packages/data/media/src/testing` — covers: FR-005, SC-001 — route: package — deps: T005
- [x] T009 Tests beside every subject and a barrel test per entry — covers: SC-002, SC-003 — route: tests — deps: T007, T008
- [x] T010 Changeset `.changeset/media-package.md` — covers: SC-001 — route: package — deps: T007
- [ ] T011 `pnpm install` to link the new member, then its tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T009
