---
"@stackra/database": minor
---

The console command `db:seed` is now `seed-pack:status` (`SeedPackStatusCommand`): it reports a seed pack's stored
records, and `stackra db seed` is the one that runs seeders (STA-1852). The `./node` export test lists
`readMigratedSchema`.
