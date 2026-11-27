# Implementation Plan: the generated Encore HTTP adapter reads a request body without Readable.toWeb

**Spec**: `.agents/specs/sta-2794-http-body/spec.md` · **Linear**: STA-2794 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2794-http-body/spec.md`

## Summary

`@stackra/app/server` gains `nodeBodyStream(request)`, which wraps a Node request's body in a Fetch `ReadableStream`
through plain `data` / `end` / `error` / `close` listeners with pause and resume for backpressure. It never touches
`request.req`, so Encore's `RawRequest` ends cleanly. `emitEncoreHttp` imports it and emits `body: nodeBodyStream(req)`
in place of `body: Readable.toWeb(req)`; the golden adapters follow.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `@stackra/app` (runtime), `@stackra/gen` (developer)
- **Testing**: vitest in `src/**/__tests__/` and the gen golden files, on CI
- **Storage**: none
- **Runtime target**: the generated Encore app (`encore run` and the built image)

## Constitution Check

| Law                                   | Result | Note                                                           |
| ------------------------------------- | ------ | -------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the generated adapter imports `@stackra/app/server`, as before |
| Secrets (ADR 0009)                    | N/A    | none                                                           |
| Security                              | PASS   | the body cap and the guard order are unchanged                 |
| HTTP and events                       | PASS   | endpoints and answers unchanged; only the body read changes    |
| Tenancy                               | N/A    | none                                                           |
| Delegation                            | PASS   | Claude only                                                    |
| Not built yet (ADR 0011)              | PASS   | Encore stays generated (ADR 0091, 0124)                        |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                                          |
| Versions and catalogs                 | PASS   | a changeset patches `@stackra/app` and `@stackra/gen`          |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                              |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                      |
| Docs and ADRs                         | PASS   | README export table and AGENTS.md rule; no ADR change          |

## Deploy modes

| Mode       | Behaviour                                                    |
| ---------- | ------------------------------------------------------------ |
| SaaS       | a generated service answers requests with a body             |
| On-prem    | a generated service answers requests with a body             |
| Air-gapped | a generated service answers requests with a body; no network |

## Correctness properties

- **P-001**: the barrel of `@stackra/app/server` lists `nodeBodyStream` and nothing else new — Validates: AC-001
- **P-002**: a `RawRequest` stand-in whose `req` is no emitter reads whole and ends with no throw on a later tick —
  Validates: AC-001, AC-002
- **P-003**: with 100 chunks of 16 KiB, the request is paused before all are read and the reader still gets every byte —
  Validates: AC-003
- **P-004**: an erroring request and a request destroyed mid-body both reject the read — Validates: AC-004
- **P-005**: cancelling the stream leaves the request destroyed — Validates: AC-005
- **P-006**: `readCappedBody(nodeBodyStream(req), 250)` over 10 000 bytes is undefined and the request is not destroyed —
  Validates: AC-006
- **P-007**: the emitted adapter contains `nodeBodyStream,` in its import and `body: nodeBodyStream(req)`, and never
  `body: Readable.toWeb(req)` — Validates: AC-007

## Architecture overview

The request path of a generated adapter is unchanged except for how Node's body becomes a web stream:
`answerCall(req, resp, call)` builds a Fetch `Request` whose body is `nodeBodyStream(req)`; `answerHttp` and
`serveGuardedCall` then read it once under `HttpConfig.maxBodyBytes` (`readCappedBody`), run the guards over the exact
bytes, authenticate and run the call, as ADR 0237 sets out.

## Components and responsibilities

- `nodeBodyStream` (`packages/runtime/app/src/server/functions/node-body-stream.function.ts`): the body as a web stream;
  copies each chunk, pauses at a full queue, resumes on pull, settles once on end, error or close, destroys on cancel.
  Never buffers and never caps.
- `@stackra/app/server` barrel: re-exports it.
- `emitEncoreHttp` (`packages/developer/gen/src/core/functions/emit-encore-http.function.ts`): imports `nodeBodyStream`
  and emits it as the body for every method other than GET and HEAD.
- `readCappedBody`: unchanged; still the one cap.

## Files and folders

```text
packages/runtime/app/
  src/server/functions/node-body-stream.function.ts
  src/server/functions/__tests__/node-body-stream.function.test.ts
  src/server/index.ts
  src/server/__tests__/index.test.ts
  README.md
  AGENTS.md
packages/developer/gen/
  src/core/functions/emit-encore-http.function.ts
  src/core/functions/__tests__/emit-encore-http.function.test.ts
  __golden__/*/expected/services/*/stackra-encore/*/http.ts.golden
.changeset/encore-raw-request-body.md
```

## Data models and migrations

none

## Contracts

`@stackra/app/server` adds `export function nodeBodyStream(request: Readable): ReadableStream<Uint8Array>`. The
generated `stackra-encore/<member>/http.ts` imports it and passes `nodeBodyStream(req)` as the `Request` body. Callers
of the existing exports see no change; consumers regenerate to get the new adapter.

## Error handling

- A request `error` event errors the web stream with that error.
- A `close` before `end` errors the web stream with "The request closed before its body ended."
- Only the first of end, error and close settles the stream; later events are ignored.
- Past the cap, `readCappedBody` answers undefined and `serveGuardedCall` answers 413, leaving the request open.

## Security and tenancy

No tenancy change. The cap, the guard order (ADR 0437) and the authenticator see the same bytes as before. A cut-off
upload can no longer pass as a complete, shorter body.

## Testing strategy

- AC-001 to AC-006: `node-body-stream.function.test.ts`, eight cases over a `RawRequest` stand-in (a `Readable` whose
  `req` is a plain object): whole read with no later-tick throw, a Fetch `Request` built the adapter's way, pause and
  resume, request error, early close, cancel, an already-ended request, and the cap through `readCappedBody`.
- AC-001: the `@stackra/app/server` barrel test lists the export.
- AC-007: `emit-encore-http.function.test.ts` asserts the import and the body line and the absence of
  `body: Readable.toWeb(req)`; the 14 golden adapters carry the same text.
- End to end: a fresh `stackra create` app under stock `pnpm run dev` answered POST with a 300 KB body (401 without a
  token) and stayed up, recorded on STA-2794.

## Rollout

A patch changeset for `@stackra/app` and `@stackra/gen`. A service picks it up on its next `stackra gen`; no
configuration or data change. Reverting the emitter line brings the crash back, which the end-to-end check reproduced.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2: the end-to-end run on a fresh app is the check beyond the unit and golden
tests.

## ADRs

ADR 0237 (the STA-2577 note: the body is streamed to `serveGuardedCall` and read once under a cap), implemented as
written. ADR 0091 and ADR 0124 (Encore is generated). ADR 0502 sets this spec's tier.

## Docs

`packages/runtime/app/README.md`, `packages/runtime/app/AGENTS.md`, the changeset.

## Complexity tracking

none
