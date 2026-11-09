---
"@stackra/database": minor
---

An index or unique key takes an explicit name with `named(...)`. Use it when the derived `idx_<table>_<columns>` is already taken, most often by a unique key on a column an earlier migration indexed:

```ts
t.unique(["tenant_id"]).named("uq_<table>_tenant_id").concurrently();
```

The usual case is the column `t.belongsToTenant()` writes. A blueprint that declares two indexes under one name is now refused at compile time, before Postgres would refuse the second `CREATE INDEX`. Derived names don't change, so no migration that has already run changes its checksum.
