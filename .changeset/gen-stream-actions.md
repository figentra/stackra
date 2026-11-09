---
"@stackra/gen": minor
---

Gen reads a `stream: true` action's `Promise<ReadableStream<Chunk>>` output (no output shape), marks the manifest entry `stream: true`, and projects its 200 response as `text/event-stream` in `openapi.json`. A `stream` option and a stream output that disagree fail with `stream_output_mismatch`.
