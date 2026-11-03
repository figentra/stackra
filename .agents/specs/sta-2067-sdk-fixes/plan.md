# Implementation Plan: SDK fixes: the TypeScript SDK keeps a base-URL prefix, and every SDK creates the Idempotency-Key

**Spec**: `.agents/specs/sta-2067-sdk-fixes/spec.md` · **Linear**: STA-2067 · **Date**: 2026-11-03

**Input**: Feature specification from `.agents/specs/sta-2067-sdk-fixes/spec.md`

## Summary

In `emitSdks`, the TypeScript client builds its URL as `new URL(baseUrl.replace(/\/+$/, "") + path)` instead of
`new URL(path, baseUrl)`, matching the Python (`rstrip("/")`) and PHP (`rtrim`) clients. Each client's `call` resolves
the key once, before the request: the caller's key, else for a write a fresh UUID (`crypto.randomUUID()`,
`str(uuid.uuid4())`, a v4 UUID from `random_bytes(16)`); a `GET` sends none.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`); the emitted SDKs are TypeScript, Python 3 and PHP 8.1 text
- **Members**: `packages/developer/gen` (`tier:lib`)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); the emitted TypeScript SDK is transpiled with the
  `typescript` dependency gen already has and run against a fake `fetch`
- **Storage**: none
- **Runtime target**: a library (gen's build-time emitter)

## Constitution Check

| Law                                   | Result | Note                                                                |
| ------------------------------------- | ------ | ------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | only gen's own emitter and its test change                          |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                                          |
| Security                              | PASS   | keys come from each platform's cryptographic random source          |
| HTTP and events                       | PASS   | non-GET calls carry `Idempotency-Key`, as the HTTP conventions want |
| Tenancy                               | N/A    | no tenant data                                                      |
| Delegation                            | PASS   | one session, one worktree                                           |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                              |
| Test placement (ADR 0022)             | PASS   | the test sits in `__tests__/` beside `emit-sdks.function.ts`        |
| Versions and catalogs                 | PASS   | no dependency added; `pnpm-lock.yaml` unchanged                     |
| Deploy modes (ADR 0076)               | PASS   | build-time output, same in all three                                |
| Licence tier (ADR 0077)               | PASS   | free                                                                |
| Docs and ADRs                         | PASS   | gen README Public SDKs paragraph; no ADR change                     |

## Deploy modes

| Mode       | Behaviour                                         |
| ---------- | ------------------------------------------------- |
| SaaS       | same generated SDKs; no runtime difference in gen |
| On-prem    | same                                              |
| Air-gapped | same                                              |

## Correctness properties

- **P-001**: for every base URL `b` and endpoint path `p`, the TypeScript request URL is `b` without trailing slashes
  followed by `p` (with path parameters filled) — Validates: FR-001
- **P-002**: a write with no caller key carries exactly one `Idempotency-Key`, a UUID, made once per call before the
  request is built, in all three SDKs — Validates: FR-002
- **P-003**: a caller key is sent unchanged, and a `GET` carries no key — Validates: FR-003

## Architecture overview

`emitSdks(manifest)` is pure: it reads the manifest's public entries and returns three files whose text holds each
client's private `call`. The fix lives only in those three `call` bodies and the TypeScript `CallOptions` doc comment.

## Components and responsibilities

- `typescriptSdk` (gen): URL concatenation; the key default `options.idempotencyKey ?? (method === "GET" ? undefined :
globalThis.crypto.randomUUID())`.
- `pythonSdk` (gen): `import uuid`; the key default in `_call`.
- `phpSdk` (gen): the key default in `call`, a v4 UUID from `random_bytes(16)`.

## Files and folders

- `packages/developer/gen/src/core/functions/emit-sdks.function.ts`
- `packages/developer/gen/src/core/functions/__tests__/emit-sdks.function.test.ts`
- `packages/developer/gen/README.md`
- `.changeset/sta-2067-sdk-fixes.md`

## Data models and migrations

none

## Contracts

Generated SDK methods keep their signatures. Behaviour: the TypeScript URL keeps the base-URL prefix; every write
carries `Idempotency-Key` (the caller's, else generated). No action, query, event or export of gen changes.

## Error handling

No new error. A TypeScript runtime with no global Web Crypto throws a `TypeError` on a write that passes no key, before
any request is sent, so nothing reaches the server half-made (spec EC-04).

## Security and tenancy

The key is random (UUID v4 from each platform's CSPRNG), carries no personal data, and only scopes deduplication in the
pipeline's idempotency step, which keys it with the caller's identity (ADR 0136 decision 3). No tenant data.

## Testing strategy

- AC-001: `emit-sdks.function.test.ts` transpiles the TypeScript SDK and calls a write with a prefixed base URL and
  with a trailing slash, reading the URL from a fake `fetch`; the Python and PHP concatenation stays asserted.
- AC-002: the same run checks a generated UUID key on a write with no key, the caller's key when passed, and no key on
  a `GET`; the Python and PHP text is checked for the generator inside `call`, before the request.
- All runs on ci-box: gen `test`, `typecheck`, `lint`, then `pnpm verify` for `@stackra/gen`.

## Rollout

A patch changeset for `@stackra/gen`. Generated SDKs change on the next `stackra gen`; `.stackra/` is gitignored, so
no member commit.

## Delegation and risk plan

One session in worktree `.claude/worktrees/sta-2067`. Every install, typecheck and test runs on ci-box. Before
shipping, merge `origin/main` in. Budget: small (one PR).

## ADRs

ADR 0136 decision 3 (the SDKs generate the key), ADR 0138 (pipeline order: idempotency), ADR 0217 decision 1 (public
SDKs), OS ADR 0039 decisions 2 and 3: all Accepted.

## Docs

`packages/developer/gen/README.md` (Public SDKs).

## Complexity tracking

none
