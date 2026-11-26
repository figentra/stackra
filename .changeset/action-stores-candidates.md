---
"@stackra/runway": patch
---

`checkActionStores` also requires the driver a deployed environment selects for `config.actions.stores.<field>` to be a
candidate of the port in the member's generated manifest (`postgres` comes with `@stackra/database`, `valkey` with
`@stackra/actions`), so `runway validate` and `stackra validate --repository` no longer approve a driver the service
cannot build. A manifest row without `candidates` is still held to durability only.
