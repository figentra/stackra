# Plan: `@stackra/filesystem` wave 2

**Spec**: `.agents/specs/sta-348-filesystem/spec.md`

## Design

- `FileSystem` (key `filesystem.FileSystem`) and `EncoreBucket` (key `filesystem.EncoreBucket`) are ports in
  `src/contracts/ports/`; `FileStat` and `WriteOptions` are contract types. The contracts entry imports nothing else of
  the package.
- `normalizePath`, `normalizePrefix` and `publicUrl` in `src/core/functions/` are internal and shared by every driver,
  so the traversal check is written once.
- `FilesystemOptions` (`disk: DriverName<FileSystem> = "memory"`, `root`, `url`, `s3`) registers the hand-written
  `FILESYSTEM_CONFIG_SCHEMA`, re-exported as `FilesystemConfig$`. `FILE_SYSTEM_DISKS` feeds both the schema's disk enum
  and a stand-in `DriverRegistry` augmentation, so the type and the runtime check cannot drift.
- `FilesystemConfig` is `Config({ schema: FilesystemOptions })` in `src/config/`; `configKey` derives `filesystem`.
- Drivers extend `Driver(FileSystem)` and are named by their file prefix: `memory` (`.`, takes the config and
  `Clock`), `local` (`./node`, `node:fs`, temporary file plus rename), `s3` (`./node`, `@aws-sdk/client-s3` and the
  presigner, credentials from the SDK chain), `encore_bucket` (`./node`, takes `EncoreBucket`), `electron`
  (`./electron`, delegates to a local driver rooted at `app.getPath("userData")/<root>`, `file:` URLs).
- `FileNotFoundError` is a plain `Error`: a disk sits below the action pipeline.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                                                                                                   |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/data/filesystem`; workspace imports are other packages only (`@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/validation`); the Encore bucket is the `EncoreBucket` port, so no `encore.dev` import, no app or service |
| Secrets (ADR 0173)                    | PASS   | no credential field in `FilesystemOptions`; the package stores and logs none                                                                                                                                                                                           |
| Security                              | PASS   | every key is normalised before storage is touched                                                                                                                                                                                                                      |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                                                                                                                           |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                                                                                                                         |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                                                                                                                 |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                                                                                                                       |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                                                                                                              |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only; the `@aws-sdk/*` pins are added by the owner (T011)                                                                                                                                                                                 |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                                                                                                        |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                                                                                                                     |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                                                                                                                |

- Boundaries: runtime imports workspace packages, `zod`, the AWS SDK and (in `./electron`) `electron`; no app,
  service or `encore.dev`. `./electron` imports the local driver from `src/node/`, both Node runtimes.
- Versions: catalogs and `workspace:*` only; the AWS SDK needs a catalog entry from the owner.
- Naming: v3.1; files `<name>.<kind>.ts`; drivers `<Prefix>FileSystemDriver`; driver names snake_case.
- Secrets: none held; tests use fake credential values set through `vi.stubEnv` only.
- No parameter properties and no `#private` fields.

## Deploy modes

| Mode       | Behaviour                                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SaaS       | a build-time library, bundled into the consumer's app or service                                                                                                         |
| On-prem    | identical: the same build, no SaaS-only code path                                                                                                                        |
| Air-gapped | identical: the memory and local drivers need no network; the S3 and Encore bucket drivers are chosen and configured by the consumer, so the package makes no call itself |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.`, `./contracts`, `./node` and `./electron` — Validates: FR-001
- **P-002**: `./contracts` exports `FileSystem`, `EncoreBucket`, `FileStat` and `WriteOptions` — Validates: FR-002
- **P-003**: `.` exports `FilesystemConfig`, `FilesystemConfig$`, `FilesystemOptions`, `MemoryFileSystemDriver` and `FileNotFoundError` — Validates: FR-003
- **P-004**: `./node` exports `LocalFileSystemDriver`, `S3FileSystemDriver` and `EncoreBucketFileSystemDriver` — Validates: FR-004
- **P-005**: `./electron` exports `ElectronFileSystem` and `ElectronFileSystemDriver` as one class, so `ElectronFileSystem === ElectronFileSystemDriver` — Validates: FR-005
- **P-006**: no file under `src/` imports `encore.dev`, `FilesystemOptions` has no credential field, and every driver normalises a key before it touches storage — Validates: FR-006
