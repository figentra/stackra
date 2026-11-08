---
"@stackra/cli": patch
---

The session-settings check now allows the shared replay of the `withScope` settings (used by a replica read and a
`requiresNew` transaction) instead of the Postgres database driver, which no longer writes a setting itself.
