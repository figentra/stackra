---
"@stackra/gen": patch
---

The gen golden fixtures commit the seed entry (`.stackra/entry/seed.ts`) that gen writes for the `service` fixture's shop
and the overlay fixtures built on it, since that shop has a seeder and a factory (STA-2061). Tests only; gen's output is
unchanged.
