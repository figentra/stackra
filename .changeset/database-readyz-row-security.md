---
"@stackra/database": minor
---

`DatabaseConfig.health.rowSecurity` (off by default): `/readyz`'s `database` probe also reads the connected role and is
`down`, whatever `critical` says, when that role can bypass row-level security. That covers a superuser, BYPASSRLS
(its own or through a role it belongs to), or the owner of a table with row security, which could turn FORCE off.
Runway turns it on for deployed environments, so a deploy whose runtime role could bypass `FORCE ROW LEVEL SECURITY`
never goes ready (tenancy audit gap J).
