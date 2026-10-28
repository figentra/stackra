---
"@stackra/app": minor
---

The server `createApp` no longer passes `url` (the process's `DATABASE_URL`) to the generated boot:
`ServerAppOptions["boot"]` takes `{ signal }` only, since the boot connects with its service's Encore database url
(STA-1401). The migrate and seed CLIs keep reading `DATABASE_DIRECT_URL`, else `DATABASE_URL`, through
`directDatabaseUrl()` of `@stackra/database/node`.
