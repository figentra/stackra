# AGENTS — @stackra/runway

Runway format version 3 (ADR 0296) as code. Member at `packages/developer/runway` (`tier:lib`). Entries `.` and
`./node`, plus the `schema/{root,app,service}.json` assets, byte copies of `tools/schemas/runway-*.schema.json`
(ADR 0127, 2026-10-24 note).

## Where code goes

| You are writing…                        | It goes in…                                 |
| --------------------------------------- | ------------------------------------------- |
| A runway zod schema (internal)          | `src/core/constants/<name>.constant.ts`     |
| An enum                                 | `src/core/enums/<name>.enum.ts` (`Enum.of`) |
| An error                                | `src/core/errors/<name>.error.ts`           |
| An isomorphic function (no Node import) | `src/core/functions/<name>.function.ts`     |
| A Node-only function (reads files)      | `src/node/functions/<name>.function.ts`     |
| A port (the deploy provider)            | `src/core/ports/<name>.port.ts`             |
| A deploy provider driver (runs a CLI)   | `src/node/drivers/<name>.driver.ts`         |
| A test                                  | `__tests__/<name>.<kind>.test.ts` beside it |

## Rules

- `.` stays bundle-safe: no static `node:*` import; the dev facts file is read through `process.getBuiltinModule`.
- The canonical schemas are `tools/schemas/runway-<kind>.schema.json`, owned by main: never edit `schema/<kind>.json`
  by hand; `cp` the canonical file (`pnpm validate` checks the bytes) and change the zod to match (the
  `runwayJsonSchema` test compares them).
- Agents never call `deploy`, `promote` or `rollback` against a real provider, and never run `git push encore://`,
  `eas build` or `eas update`: tests use fake command runners; a real run is the deploy workflow's (ADR 0352 d6).
- Provider settings are runway data (`targets.<destination>`, `environments.<env>.encore|mobile`, a dedicated
  deployment's own blocks); a provider never hard-codes a branch, channel or profile.
- A runway holds secret names only. `definesFor` inlines public vars (`VITE_`, `EXPO_PUBLIC_`, `RENDERER_VITE_`) and
  never the TLS paths.

## PII

None. A runway holds resource declarations, public vars and secret names; never a secret value or a person's data.
