---
"@stackra/database": minor
---

The Postgres idempotency store keeps a refusal: migration `0008_add_idempotency_refusal` adds a nullable `refusal` jsonb column to `database.idempotency_keys`, and `completeRefused` upserts it outside the refused call's rolled-back transaction.
