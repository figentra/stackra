---
"@stackra/database": minor
---

`DatabaseConfig.health.rowSecurity` (off by default): `/readyz`'s `database` probe also reads the connected role and is
`down`, whatever `critical` says, when that role can bypass row-level security. That covers a superuser, BYPASSRLS
(its own or through a role it belongs to), the owner of a table with row security (which could turn FORCE off), a
member of `stackra_system_access`, or a role with CREATEROLE or CREATEDB: the runtime role of the runtime-role design
holds none of these.
Runway turns it on for deployed environments, so a deploy whose runtime role could bypass `FORCE ROW LEVEL SECURITY`
never goes ready (tenancy audit gap J).

Turn it on only once the service connects as its own runtime role: today a service on Encore connects as the role that
runs its migrations and owns its tables, so the probe is rightly `down` there until that role exists.
