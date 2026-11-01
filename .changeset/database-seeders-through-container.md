---
"@stackra/database": patch
---

The testing module's `.seed(...)` takes each seeder from the container when the wiring binds it, so a seeder that injects a service (a settings pack, a repository) gets it; an unwired seeder is still built without arguments.
