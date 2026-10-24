# Tasks: `@stackra/filesystem` wave 2

**Input**: `.agents/specs/sta-348-filesystem/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-filesystem/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, LICENSE, CHANGELOG) in `packages/data/filesystem` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US1] `FileSystem`, `EncoreBucket`, `FileStat`, `WriteOptions` and the `./contracts` barrel — covers: FR-002, SC-001 — route: package — deps: T002
- [x] T004 [US2] `normalizePath`, `normalizePrefix`, `publicUrl`, `FileNotFoundError` — covers: FR-006 — route: package — deps: T002
- [x] T005 [US3] `FILE_SYSTEM_DISKS`, the `DriverRegistry` entry, `FILESYSTEM_CONFIG_SCHEMA`, `FilesystemOptions`, `FilesystemConfig` — covers: FR-003 — route: package — deps: T003
- [x] T006 [US1] `MemoryFileSystemDriver` and the `.` barrel — covers: FR-003 — route: package — deps: T004, T005
- [x] T007 [US1] `LocalFileSystemDriver`, `S3FileSystemDriver`, `EncoreBucketFileSystemDriver` and the `./node` barrel — covers: FR-004, FR-006 — route: package — deps: T006
- [x] T008 [US1] `ElectronFileSystemDriver` and the `./electron` barrel (`ElectronFileSystem`) — covers: FR-005, SC-001 — route: package — deps: T007
- [x] T009 Tests beside every subject and a barrel test per entry — covers: SC-002, SC-003 — route: tests — deps: T008
- [x] T010 Changeset `.changeset/filesystem-package.md` — covers: SC-001 — route: package — deps: T008
- [ ] T011 Owner adds `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` to the default catalog — covers: FR-004 — route: owner — deps: T007
- [ ] T012 `pnpm install` to link the new member, then its tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T009, T011
