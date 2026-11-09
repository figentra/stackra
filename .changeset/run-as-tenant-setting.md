---
"@stackra/tenancy": minor
"@stackra/cli": patch
---

`runAsTenant` (`@stackra/tenancy/testing`) now sets `app.tenant_id` transaction-locally in every transaction that starts inside it on a connected database (a factory's flush, a `database.transaction`), so a test's setup rows pass the tenant policy under a role without `BYPASSRLS`, instead of being refused by row-level security. It still opens no transaction itself, sets no scope setting and proves nothing about isolation (`asTenant` does). The session-setting check allows this one testing path.
