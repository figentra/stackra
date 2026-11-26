# Feature Specification: the generated Encore HTTP adapter reads a request body without Readable.toWeb

**Feature Branch**: `figentra/sta-2794-http-body`

**Created**: 2026-11-26

**Status**: Tasked

**Tier**: feature

**Approver**: the CTO (technical-only stop; the approval is recorded by the CTO, not by this branch)

**Linear**: STA-2794

**Clarifications status**: complete

**Input**: STA-2794 item C. A fresh `stackra create` app under `encore run` crashed on every request with a body
(POST, PUT, PATCH): the generated HTTP adapter (`stackra-encore/<member>/http.ts`) built the Fetch `Request` body with
`Readable.toWeb(req)`. Node's end-of-stream cleanup behind it calls `stream.req.removeListener`, and Encore's
`RawRequest` keeps its native request, which is no event emitter, in `req`, so the process threw
"stream.req.removeListener is not a function" once the body ended. The fix adds one export to `@stackra/app/server`,
`nodeBodyStream`, and the generator emits it in place of `Readable.toWeb(req)`.

The diff is feature tier only because two gen golden fixtures live under service folders named `billing` and
`payments` (the money-path rule of ADR 0502); no money code changes.

### Sources

- STA-2794 item C and the crash it records ("stream.req.removeListener is not a function" under `encore run`)
- `packages/runtime/app/src/server/functions/node-body-stream.function.ts` (new) and `packages/runtime/app/src/server/index.ts`
- `packages/runtime/app/src/server/functions/read-capped-body.function.ts` (the cap, unchanged)
- `packages/developer/gen/src/core/functions/emit-encore-http.function.ts` and the gen golden `http.ts.golden` files
- ADR 0237 (STA-2577 note: the body is streamed to `serveGuardedCall` and read once under `HttpConfig.maxBodyBytes`)
- ADR 0091 and ADR 0124 (Encore is the generated runtime target)

## Impact

- **Apps touched**: none (a generated app picks the fix up on its next `stackra gen`)
- **Services touched**: none in this repository; every service's generated `stackra-encore/<member>/http.ts` changes on
  the next gen
- **Packages touched**: `@stackra/app` (new `nodeBodyStream` in `./server`), `@stackra/gen` (the HTTP adapter emitter
  and 14 golden `http.ts.golden` files)
- **Public contract change**: `@stackra/app/server` adds the export `nodeBodyStream(request: Readable):
ReadableStream<Uint8Array>`; the generated adapter imports it and no longer imports a body path through
  `Readable.toWeb`. Additive: no export is removed or renamed, no signature of an existing export changes
- **Cross-service events**: none
- **Tenancy and data**: none; the body bytes reach `serveGuardedCall` unchanged, so guards, authentication and input
  parsing see the same bytes as before
- **Security and privacy**: the body cap is unchanged (`readCappedBody` under `HttpConfig.maxBodyBytes`, 413); a request
  that closes before its body ends now errors instead of being read as a whole body
- **Secrets**: none
- **ADR needed**: no (implements the ADR 0237 STA-2577 note as written)
- **New dependencies**: none (Node `stream` types and the global `ReadableStream`)
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/runtime/app/README.md` (export table), `packages/runtime/app/AGENTS.md` (the adapter's
  body rule), the changeset
- **Lane**: full
- **Change risk**: R2 (every generated service's HTTP adapter changes; the request path of every action, query and
  controller endpoint goes through it)

## Acceptance criteria

- **AC-001**: THE `@stackra/app/server` entry SHALL export `nodeBodyStream`, which returns a Node or Encore raw request's
  body as a `ReadableStream<Uint8Array>` holding every byte of the body in order.
- **AC-002**: WHEN a RawRequest body ends THE stream SHALL close without touching `req` (no event emitter on
  Encore), so the service does not crash.
- **AC-003**: WHILE the web stream's queue is full THE `nodeBodyStream` reader SHALL keep the request paused, and SHALL
  resume it on the next pull.
- **AC-004**: IF the request errors, or closes before its body ends, THEN THE `nodeBodyStream` stream SHALL error rather
  than close, so a cut-off upload is never read as a whole body.
- **AC-005**: WHEN the web stream is cancelled THE `nodeBodyStream` reader SHALL destroy the request.
- **AC-006**: WHEN `readCappedBody` reads a `nodeBodyStream` past its cap THE read SHALL answer undefined and leave the
  request open, as it does for any stream (the 413 path of ADR 0237).
- **AC-007**: THE generator SHALL emit `nodeBodyStream(req)` as the `Request` body for every method other than GET and
  HEAD in `stackra-encore/<member>/http.ts`, and SHALL never emit `Readable.toWeb(req)` as a body.

## Compatibility and migration

- Additive for callers of `@stackra/app/server`: one new export; the barrel test lists it.
- A generated app regenerates (`stackra gen`) to pick up the new adapter; until then it keeps the crashing
  `Readable.toWeb` body. No configuration, schema or data migration.
- `Readable` is still imported by the adapter for the response path (`Readable.fromWeb(response.body).pipe(resp)`),
  which is unaffected.

## Risks

- A framework that drains the request before the adapter runs: handled, `readableEnded` gives an empty body.
- Pool-backed `Buffer` chunks: each chunk is copied into its own `Uint8Array` before it is queued.
- Behaviour change on an early close: an upload cut off mid-body now errors the read (it surfaces through
  `serveGuardedCall`'s body read) instead of being passed on as a shorter body.

## Status history

- 2026-11-26 → Clarified (STA-2794 item C: the crash and its cause on Encore's `RawRequest`)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md; built in the same branch)
