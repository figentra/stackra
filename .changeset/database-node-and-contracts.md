---
"@stackra/database": minor
---

Add the `./node` entry (`PostgresDatabaseDriver`, `DatabaseUnitOfWorkDriver`) and the `./contracts` entry
(`VisibilityFilter`, `Where`); both leave `.`. `Database` stays in `.` because it carries `Database.current()`. Gen's
generated boot imports the Postgres driver from `@stackra/database/node`.
