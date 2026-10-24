# AGENTS — @stackra/runway

Runway format version 3 (ADR 0296) as code. Member at `packages/developer/runway` (`tier:lib`). Entries `.` and
`./node`, plus the committed `schema/{root,app,service}.json` assets (ADR 0127, 2026-10-24 note).

## Where code goes

| You are writing…                        | It goes in…                                 |
| --------------------------------------- | ------------------------------------------- |
| A runway zod schema (internal)          | `src/core/constants/<name>.constant.ts`     |
| An enum                                 | `src/core/enums/<name>.enum.ts` (`Enum.of`) |
| An error                                | `src/core/errors/<name>.error.ts`           |
| An isomorphic function (no Node import) | `src/core/functions/<name>.function.ts`     |
| A Node-only function (reads files)      | `src/node/functions/<name>.function.ts`     |
| A test                                  | `__tests__/<name>.<kind>.test.ts` beside it |

## Rules

- `.` stays bundle-safe: no static `node:*` import; the dev facts file is read through `process.getBuiltinModule`.
- A schema change regenerates `schema/<kind>.json` from `runwayJsonSchema(kind)`; a test fails when they drift.
- A runway holds secret names only. `definesFor` inlines public vars (`VITE_`, `EXPO_PUBLIC_`, `RENDERER_VITE_`) and
  never the TLS paths.

## PII

None. A runway holds resource declarations, public vars and secret names; never a secret value or a person's data.
