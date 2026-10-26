---
"@stackra/access-log": minor
---

`AccessLogService` fails closed for the classes in `AccessLogConfig.failClosed` (financial and health by default) and
for a facet marked `failClosed: true`, refusing the read with `access_log_write_failed` after logging it; every other
class still fails open. Add `OutboxAccessLogSinkDriver` (`sink: outbox`) and the `AccessRecorded` event so read audits
reach the audit service. The chain hash now uses `@stackra/support`'s `canonicalHash`, byte for byte the earlier form
(STA-821, ADR 0409). New dependencies: `@stackra/events`, `@stackra/support`.
