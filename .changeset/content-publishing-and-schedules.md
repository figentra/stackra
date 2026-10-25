---
"@stackra/content": minor
---

Add `Publishable`, `Sluggable` and `Schedulable` (ADR 0321 decisions 2 and 6), `PublicationStatus`, `isPublished`
and the any-script `slugOf`, and `RevisionService` (draft, publish, current, schedule in a campaign, publishDue,
unschedule, rollback). Migration `0003-add-revision-schedule` adds `scheduled_at` and `campaign` to
`content.revisions`.
