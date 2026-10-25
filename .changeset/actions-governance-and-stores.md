---
"@stackra/actions": minor
---

Add the approval step (`ApprovalGate`, `approval_required` with `CallOptions.approvalId`), the `Effect` tags with
`bulk` on `ActionRegistration` and `CallDescriptor`, `structural` actions guarded by `LiveConfigurationGuard`
(`live_read_only`), `meter` with the `UsageRecorded` event written in the unit of work, the `OutboxAuditTrailDriver`
with `AuditEntryRecorded`, the offline cap's `amountField`, and the Valkey idempotency and rate-limit stores with
`StoresConfig`.
