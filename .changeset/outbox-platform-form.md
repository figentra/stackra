---
"@stackra/outbox": minor
"@stackra/data-maintenance": minor
"@stackra/data-transfer": minor
---

The outbox tables are tenant-owned in the platform form (migration `outbox.0006_contract_outbox_tenancy`):
`messages`, `deliveries`, `changes` (every partition, the default included), `replica_changes`,
`device_sequences` and `offline_cap_uses` get a nullable `tenant_id`, filled from `app.tenant_id` by default (a
NULL row is the platform's), forced row-level security and the platform policies. Cross-owner readers claim through
system functions that return ids, owners and order or lease columns only, and load or change each row in its owner.

Upgrade: drain the relay before you migrate. The migration backfills a row at a tenant node (`nlevel(scope_path) =
3`) from its scope and keeps a row with no scope, at the root or at a product node, as a platform row. It refuses,
changing nothing, while a message, delivery, change, replica change or device sequence sits below a tenant node,
naming each count and the remedy: deliver or dead-letter pending messages and deliveries and delete those dead
letters; let every change consumer pass such changes and delete them (or wait for retention); delete such replica
changes (their devices fill again); settle and delete such device sequences. Existing `offline_cap_uses` rows have no
scope and become platform rows.

Platform messages and changes (written with no tenant) carry no personal data: no tenant's erasure can rewrite them.

Migration `outbox.0007_revoke_secure_change_partition` revokes `outbox.secure_change_partition(text)` from `PUBLIC`
(defence in depth: it has invoker rights, and its owner, the migrating role, still runs it on each new partition).

Breaking port changes, for a custom driver:

- `OutboxDriver`: `due` is `claim` (returns `OutboxClaim`: id, `ownerId`, due time) plus `load(id)`; `pruneDead` is
  `claimDead`, each claim then deleted with `remove` in its owner.
- `ChangeFeed`: `read` is `claim` (returns `ChangeClaim`: position, `ownerId`) plus `load(positions)`; `maintain` no
  longer deletes the default partition's expired rows: `expired` claims them and `remove` deletes them per owner
  (`maintainChangeLog` does both).
- `DeliveryDriver`: `lease` and `list` return `DeliveryClaim` (id, `ownerId`, subscriber, state), `list` also takes
  an `id`, and `load(id)` returns the delivery.

New in `@stackra/outbox`: `loadChanges`, `maintainChangeLog`, `boundIsolation`, `ClaimNotLoadedError` (a claimed row
that does not load in its owner) and `RowIsolationMissingError` (an owned row with no `CallIsolation` bound). Both
fail the work: a claimed row is never skipped. `pruneOutbox` takes the isolation as its last argument.

`@stackra/data-maintenance`: `PruneOutboxAction` and `MaintainChangeLogAction` inject the `Container` and read the
`CallIsolation` from it optionally. `@stackra/data-transfer`: `WarehouseChangeSink` takes the `Container` as its fourth
argument and loads each owner's changes in its owner. An app without tenancy still boots; its platform rows run as
before.
