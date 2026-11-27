---
"@stackra/runway": minor
---

`plannedExtensions(services, environment, members?)` and `createExtensionsScript(extensions)` give the infrastructure
the Postgres extensions a server must hold and the idempotent psql script that creates them with the admin login in
`template1` and every database that takes connections, before any migration runs (ADR 0160 note of 2026-11-26). The
script refuses a name outside `PostgresExtension` and stops non-zero at the first database psql fails in.
