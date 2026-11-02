---
"@stackra/database": patch
---

`@stackra/database/testing` loads its optional Testcontainers peers (`@testcontainers/postgresql`, `testcontainers`)
only when `usePostgres()` starts a container, so a member without them can import `./testing` and run its unit tests
(STA-1950). Before this, every unit test that loaded a factory failed with "Cannot find package
'@testcontainers/postgresql'".
