---
"@stackra/gen": minor
"@stackra/loyalty-kit": minor
"@stackra/analytics": minor
"@stackra/privacy": minor
"@stackra/identity": minor
"@stackra/consent": minor
"@stackra/segments": minor
"@stackra/webhooks": minor
"@stackra/data-maintenance": minor
"@stackra/media": minor
"@stackra/collaboration": minor
"@stackra/panel": minor
"@stackra/access-log": minor
"@stackra/actions": patch
---

Every write action's permission is at least L2 (STA-2096, owner decision 2026-11-04). gen refuses an action whose
permission is L0 or L1 with `action_risk_below_write`. Raised: `collaboration.room.publish`, `media.upload.create`,
`data_maintenance.synonym.create` and `.update`, `analytics.analytics_batch.ingest`, `consent.consent_snapshot.issue`,
`identity.passkey.challenge`, `loyalty_kit.loyalty_account.enroll` to L2;
`segments.segment.recompute` and `privacy.subject.export` to L2 (system); `loyalty_kit.loyalty_account.redeem` and
`.stamp` to L3 (a points balance); `loyalty_kit.loyalty_account.expire` to L3 (system); `panel.view.share` to L2;
`identity.passkey.verify` (it mints a session) and `identity.passkey.confirm` (it keeps a new key) to L4;
`webhooks.webhook_delivery.send` (an external send) and `access_log.access_log_entry.purge` (it deletes for good) to L4
(system).
