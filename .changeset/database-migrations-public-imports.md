---
"@stackra/database": patch
---

The package's own migrations (`0001`–`0004`) import `Migration`, `Extension` and their types from `@stackra/database`
instead of the internal `#core/*` aliases. A service that installs `@stackra/database` from the registry compiles them
from a copy in its own `.stackra/cache`, where `#core` does not resolve, so gen refused them with
`migration_load_failed`. The compiled SQL is unchanged.
