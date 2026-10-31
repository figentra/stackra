---
"@stackra/database": patch
---

The Postgres idempotency store joins the running transaction instead of opening its own (STA-1699, ADR 0495 note of
2026-11-01). A call that joined an outer transaction whose commit then fails no longer leaves a completed key, so its
retry runs again instead of replaying a success that never committed.
