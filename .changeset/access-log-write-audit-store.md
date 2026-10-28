---
"@stackra/access-log": minor
---

Add the write audit store (ADR 0465 decision 4): `PostgresAuditTrailDriver`, the `postgres` driver of the `AuditTrail`
port of `@stackra/actions`, stores every audited action call as an `AuditLogEntry` in `access_log.audit_log_entries`,
hash-chained per tenant (`linkAuditEntry`, `findAuditChainBreak`), inside the caller's transaction. `AuditQuery`
(`access_log.audit_log_entry.search@1`, L1) pages it by call, action key, actor, outcome and time. A call in no tenant
is logged as `audit_write_skipped` and never fails. New types `AuditRecord` and `AuditLink`; migration
`0002-create-audit-log-entries`.
