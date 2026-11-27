# Implementation Plan: MediaLibrary scans every file before it places or links it

**Spec**: `.agents/specs/sta-669-media-scan-gate/spec.md` · **Linear**: STA-669 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-669-media-scan-gate/spec.md`

## Summary

Inject the `FileScanner` port into `MediaLibrary` and call it on every file before it reaches a served path or a link.
`claim` and `store` scan the bytes while they wait under `uploads/` and write those same bytes to the bucket path only
on a `clean` verdict; `infected` and `failed` delete and refuse, `pending` keeps the upload and raises a retryable
error. `MediaFile` records the verdict, and `temporaryUrl` scans any record without a clean one before linking it.
`MediaConfig` gains the runtime-only `environment` (STA-2844's reader), and its schema refuses the `memory` scanner in
a deployed environment, so boot fails. The `guard_duty` driver pins GuardDuty's tag to the object it heads and calls
it clean only when that object is the caller's bytes.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/data/media`, `packages/developer/gen`, `packages/design-system/branding` (tests only)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); an integration tier (`vitest.int.config.ts`, `test:int`) on
  Testcontainers clamd and a Testcontainers LocalStack (an S3 API) for `guard_duty`
- **Storage**: the `FileSystem` disk; no database
- **Runtime target**: a library used by services

## Constitution Check

| Law                                   | Result | Note                                                                  |
| ------------------------------------- | ------ | --------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | media uses its own port; gen names a token, no new import edge        |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                                            |
| Security                              | PASS   | closes a fail-open: no unscanned file is placed or linked             |
| HTTP and events                       | N/A    | no endpoint or event changes                                          |
| Tenancy                               | N/A    | no tenant-owned table; paths unchanged                                |
| Delegation                            | PASS   | one branch, media and gen only                                        |
| Not built yet (ADR 0011)              | PASS   | uses the existing `FileScanner` port and drivers                      |
| Test placement (ADR 0022)             | PASS   | tests beside their subjects in `__tests__/`; `.int.test.ts` for clamd |
| Versions and catalogs                 | PASS   | `testcontainers` from the catalog, dev only                           |
| Deploy modes (ADR 0076)               | PASS   | same gate in all three; driver per environment (ADR 0354)             |
| Licence tier (ADR 0077)               | PASS   | free packages                                                         |
| Docs and ADRs                         | PASS   | media README and AGENTS, ADR 0222 Enforcement, changeset              |

## Deploy modes

| Mode       | Behaviour                                                            |
| ---------- | -------------------------------------------------------------------- |
| SaaS       | `guard_duty` on AWS, `clamav` on GCP; the same gate in front of both |
| On-prem    | `clamav` beside the stack; the same gate                             |
| Air-gapped | `clamav` with local signatures; the same gate                        |

## Correctness properties

- **P-001**: Every file `claim` or `store` returns was scanned under `uploads/` with a `clean` verdict — Validates: FR-001, FR-002
- **P-002**: After an `infected` or `failed` verdict nothing exists at a served path and the staged file and record are gone — Validates: FR-003
- **P-003**: After a `pending` verdict nothing exists at a served path and a later claim of `ScanPendingError.upload` places it — Validates: FR-004
- **P-004**: A scanner that throws leaves a claimed upload staged and leaves nothing of a store — Validates: FR-005
- **P-005**: The bytes at the bucket path equal the bytes the scanner was given — Validates: FR-006
- **P-006**: `temporaryUrl` returns a URL only for a file whose recorded or fresh verdict is `clean` — Validates: FR-008
- **P-007**: Every `MediaFile` that `claim` or `store` returns has `scan` equal to `clean` — Validates: FR-007
- **P-008**: `MediaConfig` takes `scanner: memory` only in `dev` or `test`, and `environment` from no value — Validates: FR-009, FR-010
- **P-009**: `guard_duty` is `clean` only when the pinned object equals the caller's bytes, else `pending` — Validates: FR-011

## Architecture overview

`MediaLibrary` keeps no state; the disk holds the staged upload and its record. The change adds one dependency, the
`FileScanner` port (an abstract class token keyed `media.FileScanner`, its driver picked by `media.scanner`), and one
private step, `verdictOf(path, read)`, called by `claim`, `store` and `temporaryUrl`. `claim` reads the staged bytes
once, runs the media type, size and content checks on them, scans them, and writes them to the bucket path. `store`
writes its bytes to `uploads/<id>` first so an in-place scanner (GuardDuty) can see them. Gen's `PLATFORM_BINDINGS`
adds the token so generated wiring resolves the configured scanner.

## Components and responsibilities

- `MediaLibrary` (media): the gate in `claim`, `store`, `temporaryUrl`; `verdictOf`; the `BLOCKED` map from verdict to
  refusal reason; `recordOf` reads an optional `retainUntil`.
- `MediaFile` (media): gains `scan: ScanVerdict`.
- `FileBlockedError`, `ScanPendingError` (media): new refusals, exported from the core entry and listed in the
  manifest.
- `UploadRejectedError` (media): `reason` gains `malware` and `unscannable`.
- `PLATFORM_BINDINGS` (gen): `@stackra/media#MediaLibrary` lists `FileScanner` fourth.
- `MediaConfig`, `MediaOptions`, `MEDIA_CONFIG_SCHEMA` (media): `environment` mapped to `STACKRA_ENVIRONMENT`; a
  `superRefine` refuses `scanner: memory` where `isDeployedEnvironment` is true (the same shape as `StoresConfig` of
  @stackra/actions); the manifest's `env` row.
- `GuardDutyFileScannerDriver` (media): `HeadObject`, then `GetObjectTagging` of that version, then for a clean tag
  `GetObject` by `VersionId` (or `If-Match` and the same last write) compared with `read()`; a `412` is `pending`.

## Files and folders

```text
.changeset/media-scan-gate.md
apps/docs/src/docs/adr/0222-files-and-media-storage-drivers-uploads-scanning-and-public-assets.mdx
packages/data/media/
├── AGENTS.md
├── README.md
├── package.json
├── stackra.manifest.json
├── vitest.int.config.ts
└── src/
    ├── contracts/ports/file-scanner.port.ts
    ├── core/
    │   ├── index.ts
    │   ├── errors/file-blocked.error.ts
    │   ├── errors/scan-pending.error.ts
    │   ├── errors/upload-rejected.error.ts
    │   ├── services/media-library.service.ts
    │   └── types/media-file.type.ts
    ├── config/media.config.ts
    ├── config/__tests__/media.config.test.ts
    ├── core/constants/media-config-schema.constant.ts
    ├── core/constants/__tests__/media-config-schema.constant.test.ts
    ├── core/drivers/memory-file-scanner.driver.ts
    ├── core/schemas/media-options.schema.ts
    ├── node/actions/__tests__/create-upload.action.test.ts
    ├── node/drivers/guard-duty-file-scanner.driver.ts
    ├── node/drivers/__tests__/guard-duty-file-scanner.driver.test.ts
    ├── node/drivers/__tests__/guard-duty-file-scanner.driver.int.test.ts
    ├── node/drivers/__tests__/clamav-file-scanner.driver.int.test.ts
    └── testing/functions/__tests__/fake-upload.function.test.ts
packages/developer/gen/src/core/
├── constants/platform-bindings.constant.ts
├── constants/__tests__/platform-bindings.constant.test.ts
└── functions/__tests__/emit-wiring.function.test.ts
packages/design-system/branding/src/node/
├── models/__tests__/brand-assets.bucket.test.ts
└── services/__tests__/brand-reader.service.test.ts
```

- `media-library.service.ts`: the gate; `media-file.type.ts`: `scan`; the three error files: the refusals
- `index.ts`, `stackra.manifest.json`: exports, errors, service deps; `file-scanner.port.ts`: docblock purpose
- `vitest.int.config.ts`, `package.json`: the integration tier (`test:int`, `testcontainers`)
- `platform-bindings.constant.ts`: the binding; the remaining files are tests and docs
- `media.config.ts`, `media-config-schema.constant.ts`, `media-options.schema.ts`: the runtime-only environment and
  the memory refusal; `memory-file-scanner.driver.ts`: its boundary; `guard-duty-file-scanner.driver.ts`: the pinned
  verdict

## Data models and migrations

none (the `uploads/<id>.json` record gains an optional field, read tolerantly)

## Contracts

- `new MediaLibrary(disk: FileSystem, config: MediaConfig, clock: Clock, scanner: FileScanner)` (breaking for
  hand-built callers).
- `MediaFile.scan: ScanVerdict` (required).
- `temporaryUrl(file: Pick<MediaFile, "id" | "path"> & { readonly scan?: ScanVerdict }, expiresIn: Duration):
Promise<string>` (now `async`; may raise `ScanPendingError`, `FileBlockedError`).
- `UploadRejectedError.reason`: `"media_type" | "size" | "content" | "malware" | "unscannable"`.
- Manifest: errors `file_blocked` (`failed_precondition`) and `scan_pending` (`unavailable`); `MediaLibrary` deps gain
  `FileScanner` from `@stackra/media/contracts`.
- `MediaConfig.environment: StackraEnvironment` (default `dev`), env `STACKRA_ENVIRONMENT`, runtime-only; the
  manifest's `env` row (`kind: config`, `type: enum`, the five values).
- `MediaConfig$` refuses `{ scanner: "memory" }` with a deployed `environment` (issue path `scanner`).
- `GuardDutyFileScannerDriver.scan(path, read)` now calls `read` for a clean tag and needs `s3:GetObject`.
- Changeset: `@stackra/media` minor, `@stackra/gen` patch.

## Error handling

- `UploadRejectedError` (`malware` | `unscannable`): staged file and record deleted first; details never name the
  threat, the path or the file.
- `ScanPendingError`: retryable; carries the upload id only.
- `FileBlockedError`: not retryable; carries the reason only; the file is left for the owning service's policy.
- An unreachable scanner throws its own error unchanged; `claim` keeps the upload, `store` deletes its staged copy.

## Security and tenancy

The gate enforces ADR 0222's "an unscanned file is never served": `uploads/*` is never served, and a file crosses to
`public/` or `private/` only on `clean`. Writing the scanned bytes instead of moving the staged object closes a
time-of-check window through the still-valid signed URL. The same window on the GuardDuty side is closed by pinning
the tag to the version (or ETag and last write) and comparing that object with the bytes placed. The `memory` scanner is
refused in every deployed environment, judged by the one reader from the runtime only, so runway cannot relax it. No
permission or tenant change. Residual risks (GuardDuty bucket wiring, unversioned buckets) are named in the spec's
Risks.

## Testing strategy

- AC-001 to AC-006: `packages/data/media/src/core/services/__tests__/media-library.service.test.ts`, describe "MediaLibrary
  scan gate (ADR 0222)", with the memory scanner forced to each verdict and a throwing scanner; the cases fail when the
  gate is reverted.
- AC-007: `packages/developer/gen/src/core/constants/__tests__/platform-bindings.constant.test.ts` and
  `emit-wiring.function.test.ts` (the emitted deps include `FileScanner` and the scanner driver table).
- AC-008: `packages/data/media/src/node/drivers/__tests__/clamav-file-scanner.driver.int.test.ts` on Testcontainers
  `clamav/clamav:1.4` (`pnpm --filter @stackra/media test:int`).
- Error shape: `file-blocked.error.test.ts`, `scan-pending.error.test.ts`; exports: `core/__tests__/index.test.ts`.
- AC-009, AC-010: `packages/data/media/src/config/__tests__/media.config.test.ts` and
  `src/core/constants/__tests__/media-config-schema.constant.test.ts`; they fail with the refinement reverted.
- AC-011: `packages/data/media/src/node/drivers/__tests__/guard-duty-file-scanner.driver.test.ts` (versioned,
  unversioned, `412`, same ETag with another last write, size mismatch) and
  `guard-duty-file-scanner.driver.int.test.ts` on Testcontainers `localstack/localstack:4.4.0`, including a
  `MediaLibrary.claim` over the `s3` disk; both fail on the driver as it was.

## Rollout

Ships with the next `@stackra/media` minor. Services regenerate wiring with `stackra gen`; hand-built callers follow
the changeset. Records stored earlier are scanned on their first link, so no backfill job is needed. Before the
upgrade, every deployed environment sets `config.media.scanner` in runway (else boot fails on `scanner`), and the
`guard_duty` role gains `s3:GetObject`.

## ADRs

ADR 0222 (decision 2 and its consequence), ADR 0354, ADR 0140, ADR 0294 (decisions 16, 17, 20), ADR 0465, ADR 0266
(decision 2: a memory driver never reaches a deployment), ADR 0296 (amendment 2026-11-26: the environment comes from the
runtime only, STA-2844), all Accepted. No draft opened.

## Docs

packages/data/media/README.md (the gate, the errors), packages/data/media/AGENTS.md, ADR 0222 Enforcement, changeset.

## Complexity tracking

none
