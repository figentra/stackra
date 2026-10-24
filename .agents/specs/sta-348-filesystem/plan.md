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

## Constitution check

- Boundaries: runtime imports workspace packages, `zod`, the AWS SDK and (in `./electron`) `electron`; no app,
  service or `encore.dev`. `./electron` imports the local driver from `src/node/`, both Node runtimes.
- Versions: catalogs and `workspace:*` only; the AWS SDK needs a catalog entry from the owner.
- Naming: v3.1; files `<name>.<kind>.ts`; drivers `<Prefix>FileSystemDriver`; driver names snake_case.
- Secrets: none held; tests use fake credential values set through `vi.stubEnv` only.
- No parameter properties and no `#private` fields.
