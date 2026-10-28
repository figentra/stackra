---
"@stackra/infra-aws": patch
"@stackra/infra-gcp": patch
---

Refuse database backups kept past 35 days unless the runway states `shared.database.backups.cryptoShredded: true`
(ADR 0188 decision 3), so a backup never outlives an erasure.
