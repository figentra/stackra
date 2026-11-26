---
"@stackra/outbox": minor
"@stackra/privacy": minor
---

An erasure that cannot reach a held outbox message no longer reads as complete, and personal data is kept out of messages no erasure could reach (STA-2629). `OutboxDriver.rewrite` now resolves whether it changed the row (the Postgres driver answers `false` when row security hides a platform message from the subject's tenant), and `redactSubjectMessages` resolves a `SubjectRedaction` (`{ rewritten, unrewritable }`) instead of a bare count. The erasure saga reports the messages it found but could not rewrite as the receipt's new `unredacted` count (`EraseSubjectOutput.unredacted`), and still reads a run stored before this change. The outbox's message insert refuses an event whose class declares a `@Classified` field when the transaction has no tenant (`PlatformPersonalEventError`, code `platform_personal_event`), before writing anything.

Breaking for anyone implementing `OutboxDriver` (only the shipped memory and Postgres drivers do): `rewrite` resolves a boolean. Breaking for a direct caller of `redactSubjectMessages`: it resolves `{ rewritten, unrewritable }`.
