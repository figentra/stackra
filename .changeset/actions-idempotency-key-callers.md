---
"@stackra/actions": minor
---

An API-key caller (a call with a credential, an `api_client` actor or an `api_key` origin) must send an `Idempotency-Key` on every write, whatever the action declares; every other caller keeps the declared policy. The idempotency scope now includes the API key and the mode (test or live), so a principal's keys never share an answer. Existing records are keyed afresh once and expire within the retention.
