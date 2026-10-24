# Feature Specification: `@stackra/filesystem` wave 2, server disks

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: resolved (registry v3.1 row: entries `.`, `./contracts`, `./node`, depends on config, template
import `./contracts` `FileSystem`; the template's generated desktop wiring also imports `./electron`
`ElectronFileSystem`, and the ADR 0127 2026-10-24 note allows `./electron` as a runtime-target entry; ADR 0234 places
the package in `data`; ADR 0124 forbids `encore.dev` in a package, so the Encore disk drives a port)

**Input**: Build `@stackra/filesystem` (data, wave 2) for real: the `FileSystem` port and the server disks memory,
local, Encore bucket and S3/R2, plus the Electron main-process disk the template's desktop wiring binds.

## Impact

- **Apps touched**: none (the template's console desktop wiring binds `ElectronFileSystem`; STA-344)
- **Services touched**: none (services select `filesystem.disk` through runway values)
- **Packages touched**: `packages/data/filesystem` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none; no tables. Tenant key layout and scanning stay with the files service (ADR 0222)
- **Secrets**: none held. The S3 driver uses the AWS SDK default credential chain, fed by runway from Infisical
- **ADR needed**: no (ADR 0234, 0222, 0124, 0294 decisions 4, 15, 16, 19, 20 and 26; ADR 0127 2026-10-24 note)
- **New dependencies**: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` (not yet in a catalog; referenced as
  `catalog:`); `electron` from `catalog:desktop` as an optional peer; `zod` and workspace packages as today
- **Deploy modes**: memory and local need no network (air-gapped safe); s3 reaches the configured endpoint only
- **Lane**: full (a new package)
- **Change risk**: R3 (key handling is the path-traversal boundary of every disk)

## User Scenarios & Testing

### User Story 1 - Store and serve files through one port (Priority: P1)

A service injects `FileSystem` and calls `write`, `read`, `exists`, `delete`, `list`, `stat`, `url` and
`temporaryUrl`; runway's `filesystem.disk` decides which driver answers.

**Independent Test**: `src/core/drivers/__tests__/memory-file-system.driver.test.ts`,
`src/node/drivers/__tests__/{local,s3,encore-bucket}-file-system.driver.test.ts`,
`src/electron/drivers/__tests__/electron-file-system.driver.test.ts`.

**Acceptance Scenarios**:

1. **Given** a written file, **Then** `read` returns its bytes, `exists` is true, `stat` reports its size, and `delete`
   returns true once and false after.
2. **Given** nothing under a key, **Then** `read` and `stat` throw `FileNotFoundError`.
3. **Given** keys `images/a.png`, `images-2026/c.png`, **Then** `list("images/")` returns only the first and
   `list("images")` both, sorted.
4. **Given** `filesystem.url`, **Then** `url` is that base plus the encoded key; without it, `url` throws.
5. **Given** the s3 disk, **Then** `temporaryUrl(key, Duration.minutes(10))` is a SigV4 presigned GET with
   `X-Amz-Expires=600`; the Encore disk passes `ttl` seconds; the local disk refuses.

### User Story 2 - No key leaves the disk (Priority: P1)

**Independent Test**: `src/core/functions/__tests__/normalize-path.function.test.ts` and each driver test.

1. **Given** `../x`, `a/../../b`, a backslash or a NUL, **Then** every driver throws `RangeError` before touching
   storage.
2. **Given** `/a//b/./c`, **Then** the key is `a/b/c`.
3. **Given** a crash during a local write, **Then** no half-written file sits under the key (temporary file, rename).

### User Story 3 - Configure the disk (Priority: P1)

**Independent Test**: `src/config/__tests__/filesystem.config.test.ts`,
`src/core/constants/__tests__/filesystem-config-schema.constant.test.ts`.

1. **Given** `FilesystemConfig`, **Then** its key is `filesystem`, matching the template's runway `filesystem.disk`.
2. **Given** runway values `disk: local` and `disk: s3`, **Then** they build; **given** `disk: ftp`, **Then**
   `ConfigInvalidError`.
3. **Given** `FilesystemConfig$`, **Then** every field is a zod default, `.shape.s3.unwrap()` and `.parse(undefined)`
   work, and `DriverName<FileSystem>` equals the schema's disk enum.

## Requirements

- **FR-001**: Entries `.`, `./contracts`, `./node` (registry row) and `./electron` (template, ADR 0127 note).
- **FR-002**: `./contracts` exports `FileSystem` (template) and `EncoreBucket`, `FileStat`, `WriteOptions`.
- **FR-003**: `.` exports `FilesystemConfig`, `FilesystemConfig$`, `FilesystemOptions`, `MemoryFileSystemDriver`,
  `FileNotFoundError`.
- **FR-004**: `./node` exports `LocalFileSystemDriver`, `S3FileSystemDriver`, `EncoreBucketFileSystemDriver`.
- **FR-005**: `./electron` exports `ElectronFileSystem` (template name) and `ElectronFileSystemDriver`, one class.
- **FR-006**: No `encore.dev` import, no credential field, every key normalised before storage is touched.

## Success Criteria

- **SC-001**: Every symbol the template imports from `@stackra/filesystem` exists with the shape it uses:
  `FileSystem` from `./contracts` as a port class (a binding dependency and a driver port), `ElectronFileSystem` from
  `./electron` as a driver class of `FileSystem` reached by `m.ElectronFileSystem`.
- **SC-002**: A test beside every public symbol, plus a barrel test per entry, passes in the testing workflow.
- **SC-003**: No request leaves the process in the tests (S3 `send` is replaced; presigning is local).

## Not in this build

- Named disks (`Named<FileSystem, "public">` with per-disk settings): one disk per member until a consumer needs two.
- The Azure, GCS and Postgres bytea drivers ADR 0222 lists, and MinIO beyond the S3 driver's path style.
- Granting the Electron disk a user-picked folder outside `userData`: the platform folder-picker bridge decides that.
