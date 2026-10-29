---
"@stackra/access-log": minor
---

Add the audit export (STA-1579): `ExportAuditAction` (`access_log.audit_log_entry.export@1`, permission
`AuditLogEntryPermissions.export`, L2) pages the tenant's write audit through `AuditQuery` and pushes each page as one
NDJSON batch to the new `AuditExportSink` port; `HttpsAuditExportSinkDriver` POSTs it to `AccessLogConfig.exportUrl`
(HTTPS only) with the `ACCESS_LOG_EXPORT_TOKEN` secret; `AuditExportFailedError` is its retryable refusal. Add
`AccessLogConfig.auditRetentionDays`, the stated retention of the write audit, unset until the owner states it.
