---
"@stackra/database": patch
---

`t.change().type()` writes `-- squawk-ignore changing-column-type`, with its reason, when the change only widens a `varchar` or turns one into `text` with no custom conversion: Postgres changes only the catalog. Narrowing and every other type change stay flagged.
