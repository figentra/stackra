---
"@stackra/gen": patch
---

A service's Encore app applies its migrations. Encore's runner runs every migration file in one transaction, so the
online index builds of `@stackra/database` migration 0006 (`create index concurrently`, which every service declares)
failed with SQLSTATE 25001 and no service started under `encore run`. The copy gen writes to the Encore service's
`migrations/` folder now builds each online step in its plain form; `.stackra/migrations`, which `stackra db migrate`
applies in production, keeps the online form (ADR 0159, amendment of 2026-11-10). Regenerate (`stackra gen`).
