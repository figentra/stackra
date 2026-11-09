---
"@stackra/actions": minor
"@stackra/app": minor
---

An action may declare `stream: true`: its `handle` answers a `ReadableStream` of JSON chunks, sent to the one caller as server-sent events (`data:` per chunk, `data: [DONE]` at the end, a `: ping` after 15 s quiet, `no-store`, no compression, no proxy buffering). The call's transaction commits when `handle` returns the stream, so the stream's writes run in `ctx.detach()` steps. The caller's forwardable token is held until the stream ends or the caller goes away, never longer. A stream action takes no `job`, `offline` or `tool`, and only `Idempotency.Never` (`stream_not_replayable`); the call descriptor carries `stream: true`.
