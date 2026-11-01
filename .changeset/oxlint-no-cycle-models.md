---
"@stackra/oxlint-config": minor
---

`import/no-cycle` is off in a module's model files (`**/src/**/models/*.ts`), so a two-way relation
(`@ManyToOne(() => Order)` and `@OneToMany(() => OrderLine)`) no longer fails; a cycle through any other file still
fails at that file.
