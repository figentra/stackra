---
"@stackra/events": minor
"@stackra/outbox": patch
"@stackra/gen": patch
---

Move the integration events' wire-name registry, `registerEventNames` and `EVENT_NAMES`, from `@stackra/outbox` down
to `@stackra/events` (STA-1387). `@stackra/outbox` re-exports both, so its writers, inbox and existing callers are
unchanged. Gen's `.stackra/gen/registrations.ts` now imports `registerEventNames` from `@stackra/events`, so a package
below the outbox (`@stackra/actions`, with `AuditEntryRecorded` and `UsageRecorded`) registers its integration events
without declaring `@stackra/outbox`, which would close a package cycle; gen no longer refuses it with
`generated_dependency_missing`.
