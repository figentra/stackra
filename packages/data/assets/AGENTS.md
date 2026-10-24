# AGENTS — @stackra/assets

Module assets. Member at `packages/data/assets` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305).
Entries `.` and `./react` only (registry v3.1 row).

## Where code goes

| You are writing…    | It goes in…                                    |
| ------------------- | ---------------------------------------------- |
| A type              | `src/core/types/<name>.type.ts`                |
| A pure helper       | `src/core/functions/<name>.function.ts`        |
| The library service | `src/core/services/asset-library.service.ts`   |
| React code          | `src/react/<name>/`                            |
| A test              | `__tests__/<name>.<kind>.test.ts(x)` beside it |

## This package

- Keys are `<module>::<kind>/<path>`; the runtime addresses an asset by key only, never by its source `file`.
- The published disk path is `<module>/<kind>/<path>`; only `public/` assets get a URL.
- Overrides live in the host's `src/overrides/<owner>/` tree and are settled by gen (ADR 0306); never read that tree at
  runtime.
- `src/*/index.ts` are stand-in barrels until gen writes them (STA-339).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

None. Assets are shipped, read-only files; tenant files belong to the files service.
