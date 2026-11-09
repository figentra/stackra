---
"@stackra/actions": minor
"@stackra/outbox": patch
"@stackra/queue": patch
"@stackra/scheduler": patch
"@stackra/workflow": patch
"@stackra/privacy": patch
"@stackra/data-maintenance": patch
"@stackra/data-transfer": patch
---

One shared owner-isolation helper. `@stackra/actions` now exports `inRowOwner(isolation, actorId, ownerId, id, work,
missing?)`, `boundIsolation(resolver)`, `ClaimNotLoadedError` (`claim_not_loaded`) and `RowIsolationMissingError`
(`row_isolation_missing`) from its `.` entry, so the tenancy families no longer each keep a copy. Every caller keeps
its own system actor id (`sys_outbox_relay`, `sys_queue_worker`, `sys_scheduler`, `sys_workflow_runner`,
`sys_privacy_holds`), the same refusals and the same rule: an owned row with no isolation bound is refused, never
skipped. Queue and scheduler keep their prefixed refusals and codes (`job_row_isolation_missing`,
`schedule_row_isolation_missing`, and their claim-not-loaded ones) and pass them to `inRowOwner`.

`@stackra/outbox` still re-exports `boundIsolation`, `ClaimNotLoadedError` and `RowIsolationMissingError` from its `.`
entry for this release only; the re-exports go away in the next minor, so import them from `@stackra/actions`. The two
refusals now appear under `@stackra/actions` in the manifests, with the same codes. `@stackra/workflow` no longer
depends on `@stackra/outbox`; `@stackra/data-transfer` now depends on `@stackra/actions`.
