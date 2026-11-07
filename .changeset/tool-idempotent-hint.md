---
"@stackra/gen": patch
---

A tool's `idempotentHint` is set only when a repeat cannot run twice: a query, or an action whose `idempotency` is
`Idempotency.Required` or `Idempotency.Derived` (ADR 0099 amendment of 2026-11-08). `Optional` runs a call without a key
every time and `Never` ignores the key, so neither tells an MCP host that a retry is safe any more.
