# Plan: testing compile cache

**Spec**: `.agents/specs/sta-1685-testing-compile-cache/spec.md`

## Design

- `@stackra/database/testing`: `pgliteSnapshot(files)` builds a migrated PGlite once per key, dumps its data
  directory (`dumpDataDir`) to a temp file (atomic rename) and keeps a per-process memo in front; `MemoryDatabaseDriver`
  starts each instance from it with `PGlite.create({ loadDataDir })`. Entity-schema members keep the slow path.
- `@stackra/vitest-config` base preset: `pool: "forks"`, `maxWorkers`, `testTimeout`, `hookTimeout`.

## Constitution Check

| Law                       | Result | Note                                                      |
| ------------------------- | ------ | --------------------------------------------------------- |
| Boundaries (ADR 0003)     | PASS   | one package, no new import                                |
| Tenancy                   | PASS   | no tenant data                                            |
| Secrets                   | PASS   | none                                                      |
| Not built yet (ADR 0227)  | PASS   | no new technology                                         |
| Test placement (ADR 0022) | PASS   | `packages/foundation/container/src/testing/**/__tests__/` |
| Versions and catalogs     | PASS   | no dependency change                                      |
