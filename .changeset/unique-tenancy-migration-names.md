---
"@stackra/achievements": patch
"@stackra/rules": patch
"@stackra/segments": patch
"@stackra/content": patch
"@stackra/search": patch
"@stackra/collaboration": patch
"@stackra/workflow": patch
---

Each package's tenancy expand migration now carries the package's name, in its class and its file
(`AddAchievementsTenancyMigration` in `0003-add-achievements-tenancy.migration.ts`, and so on), so no exported name is
declared in two packages. The SQL is unchanged. The migration ids change with the file names
(`achievements.0003_add_achievements_tenancy`); these migrations ship first in this release, so no database has
applied the old ids.
