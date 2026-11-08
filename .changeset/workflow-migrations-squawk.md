---
"@stackra/workflow": patch
---

Workflow migrations 0007 and 0009 carry reviewed squawk ignores, with their reasons, so a product that hosts
`@stackra/workflow` lints clean. The runner hashes a migration without its lint lines, so their checksums are unchanged.
Migration 0010's three warnings are already gone from `@stackra/database` 0.22.0 on, which marks setting defaults.
