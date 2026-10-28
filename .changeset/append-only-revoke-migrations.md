---
"@stackra/access-log": patch
"@stackra/ai": patch
"@stackra/loyalty-kit": patch
---

Each `AppendOnly` model's table now has a migration that calls `t.appendOnly()` (STA-1413), so `UPDATE` is revoked
from `public` and the service's role and gen's `append_only_not_revoked` check passes: access-log 0003 (access and
audit log entries), ai 0003 (`messages`, `steps`, `tool_calls`) and loyalty-kit 0003 (`ledger_entries`, exported as
`AppendOnlyLedgerEntriesMigration`).
