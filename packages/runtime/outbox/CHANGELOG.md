# @stackra/outbox

## 0.33.0

### Patch Changes

- Updated dependencies [54aa1e7]
- Updated dependencies [82c2718]
- Updated dependencies [93d63bb]
- Updated dependencies [ad4e5bf]
- Updated dependencies [246594d]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
  - @stackra/actions@0.33.0
  - @stackra/config@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/queue@0.33.0
  - @stackra/model@0.33.0
  - @stackra/database@0.33.0
  - @stackra/errors@0.33.0
  - @stackra/locking@0.33.0
  - @stackra/versioning@0.33.0
  - @stackra/console@0.33.0
  - @stackra/container@0.33.0
  - @stackra/events@0.33.0
  - @stackra/validation@0.33.0

## 0.32.0

### Patch Changes

- Updated dependencies [9ddce28]
  - @stackra/config@0.32.0
  - @stackra/actions@0.32.0
  - @stackra/database@0.32.0
  - @stackra/errors@0.32.0
  - @stackra/locking@0.32.0
  - @stackra/queue@0.32.0
  - @stackra/versioning@0.32.0
  - @stackra/model@0.32.0
  - @stackra/console@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/events@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [298af71]
- Updated dependencies [6473cf1]
  - @stackra/actions@0.31.0
  - @stackra/database@0.31.0
  - @stackra/queue@0.31.0
  - @stackra/locking@0.31.0
  - @stackra/versioning@0.31.0
  - @stackra/model@0.31.0
  - @stackra/console@0.31.0
  - @stackra/config@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/errors@0.31.0
  - @stackra/events@0.31.0
  - @stackra/validation@0.31.0

## 0.30.0

### Patch Changes

- 98a8940: Migration `outbox.0007_revoke_secure_change_partition` revokes `outbox.secure_change_partition(text)` from `PUBLIC`
  (defence in depth: it has invoker rights, and its owner, the migrating role, still runs it on each new partition).
- 82dccb3: One shared owner-isolation helper. `@stackra/actions` now exports `inRowOwner(isolation, actorId, ownerId, id, work,
  missing?)`, `boundIsolation(resolver)`, `ClaimNotLoadedError` (`claim_not_loaded`) and `RowIsolationMissingError`
  (`row_isolation_missing`) from its `.` entry, so the tenancy families no longer each keep a copy. Every caller keeps
  its own system actor id (`sys_outbox_relay`, `sys_queue_worker`, `sys_scheduler`, `sys_workflow_runner`,
  `sys_privacy_holds`), the same refusals and the same rule: an owned row with no isolation bound is refused, never
  skipped. Queue and scheduler keep their prefixed refusals and codes (`job_row_isolation_missing`,
  `schedule_row_isolation_missing`, and their claim-not-loaded ones) and pass them to `inRowOwner`.
  
  `@stackra/outbox` still re-exports `boundIsolation`, `ClaimNotLoadedError` and `RowIsolationMissingError` from its `.`
  entry for this release only; the re-exports go away in the next minor, so import them from `@stackra/actions`. The two
  refusals now appear under `@stackra/actions` in the manifests, with the same codes. `@stackra/workflow` no longer
  depends on `@stackra/outbox`; `@stackra/data-transfer` now depends on `@stackra/actions`.
- Updated dependencies [418e195]
- Updated dependencies [6005425]
- Updated dependencies [0394e56]
- Updated dependencies [96b5241]
- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [0394e56]
- Updated dependencies [d8d78f0]
- Updated dependencies [7b5a381]
- Updated dependencies [0394e56]
- Updated dependencies [8c17109]
- Updated dependencies [8c17109]
- Updated dependencies [82dccb3]
- Updated dependencies [f6a087c]
- Updated dependencies [98a8940]
- Updated dependencies [ef49e63]
- Updated dependencies [a3a3190]
- Updated dependencies [15dba8d]
  - @stackra/actions@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/database@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/queue@0.30.0
  - @stackra/container@0.30.0
  - @stackra/versioning@0.30.0
  - @stackra/model@0.30.0
  - @stackra/console@0.30.0
  - @stackra/config@0.30.0
  - @stackra/events@0.30.0
  - @stackra/validation@0.30.0
  - @stackra/locking@0.30.0

## 0.29.0

### Patch Changes

- Updated dependencies [3361957]
- Updated dependencies [b4b6422]
- Updated dependencies [09b2c41]
- Updated dependencies [11a19a7]
- Updated dependencies [45afd22]
  - @stackra/actions@0.29.0
  - @stackra/container@0.29.0
  - @stackra/database@0.29.0
  - @stackra/queue@0.29.0
  - @stackra/versioning@0.29.0
  - @stackra/model@0.29.0
  - @stackra/console@0.29.0
  - @stackra/config@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/events@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/locking@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [2b6f88c]
  - @stackra/actions@0.28.0
  - @stackra/database@0.28.0
  - @stackra/queue@0.28.0
  - @stackra/locking@0.28.0
  - @stackra/versioning@0.28.0
  - @stackra/model@0.28.0
  - @stackra/console@0.28.0
  - @stackra/config@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0
  - @stackra/events@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Minor Changes

- 8a70552: The outbox tables are tenant-owned in the platform form (migration `outbox.0006_contract_outbox_tenancy`):
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

### Patch Changes

- Updated dependencies [4a4d817]
  - @stackra/database@0.27.0
  - @stackra/locking@0.27.0
  - @stackra/queue@0.27.0
  - @stackra/actions@0.27.0
  - @stackra/versioning@0.27.0
  - @stackra/model@0.27.0
  - @stackra/console@0.27.0
  - @stackra/config@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0
  - @stackra/events@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Patch Changes

- Updated dependencies [93e358e]
- Updated dependencies [9cee75d]
- Updated dependencies [a9f21b6]
  - @stackra/database@0.26.0
  - @stackra/actions@0.26.0
  - @stackra/locking@0.26.0
  - @stackra/queue@0.26.0
  - @stackra/versioning@0.26.0
  - @stackra/model@0.26.0
  - @stackra/console@0.26.0
  - @stackra/config@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/errors@0.26.0
  - @stackra/events@0.26.0
  - @stackra/validation@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [1d7bbc1]
- Updated dependencies [dc9da69]
- Updated dependencies [8f8ddcf]
- Updated dependencies [3942ab1]
  - @stackra/database@0.25.0
  - @stackra/locking@0.25.0
  - @stackra/queue@0.25.0
  - @stackra/actions@0.25.0
  - @stackra/versioning@0.25.0
  - @stackra/model@0.25.0
  - @stackra/console@0.25.0
  - @stackra/config@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/errors@0.25.0
  - @stackra/events@0.25.0
  - @stackra/validation@0.25.0

## 0.24.0

### Patch Changes

- Updated dependencies [35959f6]
- Updated dependencies [f86dec4]
- Updated dependencies [2df7162]
  - @stackra/actions@0.24.0
  - @stackra/database@0.24.0
  - @stackra/queue@0.24.0
  - @stackra/locking@0.24.0
  - @stackra/versioning@0.24.0
  - @stackra/model@0.24.0
  - @stackra/console@0.24.0
  - @stackra/config@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/errors@0.24.0
  - @stackra/events@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [12f4836]
- Updated dependencies [82238da]
- Updated dependencies [6edeee4]
- Updated dependencies [a2c8821]
- Updated dependencies [a42a80c]
  - @stackra/database@0.23.0
  - @stackra/actions@0.23.0
  - @stackra/locking@0.23.0
  - @stackra/queue@0.23.0
  - @stackra/versioning@0.23.0
  - @stackra/model@0.23.0
  - @stackra/console@0.23.0
  - @stackra/config@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/errors@0.23.0
  - @stackra/events@0.23.0
  - @stackra/validation@0.23.0

## 0.22.0

### Patch Changes

- Updated dependencies [b394912]
- Updated dependencies [786848c]
- Updated dependencies [acbee14]
  - @stackra/database@0.22.0
  - @stackra/actions@0.22.0
  - @stackra/events@0.22.0
  - @stackra/locking@0.22.0
  - @stackra/queue@0.22.0
  - @stackra/versioning@0.22.0
  - @stackra/model@0.22.0
  - @stackra/console@0.22.0
  - @stackra/config@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/errors@0.22.0
  - @stackra/validation@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0
  - @stackra/validation@0.21.0
  - @stackra/model@0.21.0
  - @stackra/database@0.21.0
  - @stackra/actions@0.21.0
  - @stackra/versioning@0.21.0
  - @stackra/console@0.21.0
  - @stackra/config@0.21.0
  - @stackra/container@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/events@0.21.0
  - @stackra/locking@0.21.0
  - @stackra/queue@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [667a3b5]
- Updated dependencies [80d121b]
- Updated dependencies [a7b7e58]
- Updated dependencies [19a9222]
- Updated dependencies [667a3b5]
  - @stackra/actions@0.20.0
  - @stackra/database@0.20.0
  - @stackra/container@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/queue@0.20.0
  - @stackra/locking@0.20.0
  - @stackra/versioning@0.20.0
  - @stackra/model@0.20.0
  - @stackra/console@0.20.0
  - @stackra/config@0.20.0
  - @stackra/errors@0.20.0
  - @stackra/events@0.20.0
  - @stackra/contracts@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [58e3066]
- Updated dependencies [58a8fa5]
- Updated dependencies [b59aa22]
- Updated dependencies [cb26737]
- Updated dependencies [bac874e]
- Updated dependencies [12f25aa]
- Updated dependencies [e5f5432]
- Updated dependencies [40fda23]
- Updated dependencies [0da5f7a]
- Updated dependencies [0921f1f]
- Updated dependencies [dd9427a]
- Updated dependencies [4a23af8]
- Updated dependencies [fc845f4]
- Updated dependencies [0e0de4f]
- Updated dependencies [0e0de4f]
- Updated dependencies [d2b3d22]
  - @stackra/contracts@0.19.0
  - @stackra/actions@0.19.0
  - @stackra/queue@0.19.0
  - @stackra/database@0.19.0
  - @stackra/config@0.19.0
  - @stackra/versioning@0.19.0
  - @stackra/model@0.19.0
  - @stackra/console@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/events@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/locking@0.19.0

## 0.18.1

### Patch Changes

- @stackra/actions@0.18.1
  - @stackra/versioning@0.18.1
  - @stackra/database@0.18.1
  - @stackra/model@0.18.1
  - @stackra/console@0.18.1
  - @stackra/config@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/events@0.18.1
  - @stackra/validation@0.18.1
  - @stackra/locking@0.18.1
  - @stackra/queue@0.18.1

## 0.18.0

### Patch Changes

- @stackra/actions@0.18.0
  - @stackra/versioning@0.18.0
  - @stackra/database@0.18.0
  - @stackra/model@0.18.0
  - @stackra/console@0.18.0
  - @stackra/config@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/events@0.18.0
  - @stackra/validation@0.18.0
  - @stackra/locking@0.18.0
  - @stackra/queue@0.18.0

## 0.17.2

### Patch Changes

- @stackra/actions@0.17.2
  - @stackra/versioning@0.17.2
  - @stackra/database@0.17.2
  - @stackra/model@0.17.2
  - @stackra/console@0.17.2
  - @stackra/config@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/events@0.17.2
  - @stackra/validation@0.17.2
  - @stackra/locking@0.17.2
  - @stackra/queue@0.17.2

## 0.17.1

### Patch Changes

- @stackra/actions@0.17.1
  - @stackra/versioning@0.17.1
  - @stackra/database@0.17.1
  - @stackra/model@0.17.1
  - @stackra/console@0.17.1
  - @stackra/config@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/events@0.17.1
  - @stackra/validation@0.17.1
  - @stackra/locking@0.17.1
  - @stackra/queue@0.17.1

## 0.17.0

### Patch Changes

- @stackra/actions@0.17.0
  - @stackra/versioning@0.17.0
  - @stackra/database@0.17.0
  - @stackra/model@0.17.0
  - @stackra/console@0.17.0
  - @stackra/config@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/events@0.17.0
  - @stackra/validation@0.17.0
  - @stackra/locking@0.17.0
  - @stackra/queue@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/actions@0.16.0
  - @stackra/versioning@0.16.0
  - @stackra/database@0.16.0
  - @stackra/model@0.16.0
  - @stackra/console@0.16.0
  - @stackra/config@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/events@0.16.0
  - @stackra/locking@0.16.0
  - @stackra/queue@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Minor Changes

- 0b0cf51: Cross-app event relay (STA-1910, ADR 0511 decisions 11 to 19). After the outbox relay publishes an event in its own
  app, a bound `CrossAppFanOut` writes one `outbox.deliveries` row (migration `outbox.0005_create_deliveries`) per
  subscriber in another app whose events include each published version; `CrossAppRelayService` sends them under its own
  lock, leased and sent outside it, as Ed25519-signed `POST /events/inbox` requests (Standard Webhooks headers, `v1a,<key id>,<signature>`), fair per
  subscriber, with the outbox's backoff and dead letters. On the consumer, `RelayInboxService` verifies the signature
  with `ContractInboxVerifierDriver` before parsing, sets `producer` from the verified sender and hands the envelope to
  `InboxService`, answering 204, 401, 403 (an event the verified producer does not publish) or 422. New ports `DeliveryDriver`, `SubscriberSource`, `EventSigner` and
  `InboxVerifier` with memory, Postgres, config, Ed25519 and contract drivers, and the operator commands
  `outbox:relay-deliveries` and `outbox:relay-replay`. A service with no relay configuration behaves as before.

### Patch Changes

- @stackra/actions@0.15.0
  - @stackra/versioning@0.15.0
  - @stackra/database@0.15.0
  - @stackra/model@0.15.0
  - @stackra/console@0.15.0
  - @stackra/config@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/events@0.15.0
  - @stackra/validation@0.15.0
  - @stackra/locking@0.15.0
  - @stackra/queue@0.15.0

## 0.14.4

### Patch Changes

- @stackra/actions@0.14.4
  - @stackra/versioning@0.14.4
  - @stackra/database@0.14.4
  - @stackra/model@0.14.4
  - @stackra/config@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/events@0.14.4
  - @stackra/validation@0.14.4
  - @stackra/locking@0.14.4
  - @stackra/queue@0.14.4

## 0.14.3

### Patch Changes

- @stackra/actions@0.14.3
  - @stackra/versioning@0.14.3
  - @stackra/database@0.14.3
  - @stackra/model@0.14.3
  - @stackra/config@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/events@0.14.3
  - @stackra/validation@0.14.3
  - @stackra/locking@0.14.3
  - @stackra/queue@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/actions@0.14.2
  - @stackra/versioning@0.14.2
  - @stackra/database@0.14.2
  - @stackra/model@0.14.2
  - @stackra/config@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/events@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/locking@0.14.2
  - @stackra/queue@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/actions@0.14.1
  - @stackra/versioning@0.14.1
  - @stackra/database@0.14.1
  - @stackra/model@0.14.1
  - @stackra/config@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/events@0.14.1
  - @stackra/validation@0.14.1
  - @stackra/locking@0.14.1
  - @stackra/queue@0.14.1

## 0.14.0

### Patch Changes

- @stackra/actions@0.14.0
  - @stackra/versioning@0.14.0
  - @stackra/database@0.14.0
  - @stackra/model@0.14.0
  - @stackra/config@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/events@0.14.0
  - @stackra/validation@0.14.0
  - @stackra/locking@0.14.0
  - @stackra/queue@0.14.0

## 0.13.0

### Patch Changes

- @stackra/actions@0.13.0
  - @stackra/versioning@0.13.0
  - @stackra/database@0.13.0
  - @stackra/model@0.13.0
  - @stackra/config@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/events@0.13.0
  - @stackra/validation@0.13.0
  - @stackra/locking@0.13.0
  - @stackra/queue@0.13.0

## 0.12.0

### Patch Changes

- @stackra/actions@0.12.0
  - @stackra/versioning@0.12.0
  - @stackra/database@0.12.0
  - @stackra/model@0.12.0
  - @stackra/config@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/events@0.12.0
  - @stackra/validation@0.12.0
  - @stackra/locking@0.12.0
  - @stackra/queue@0.12.0

## 0.11.1

### Patch Changes

- @stackra/actions@0.11.1
  - @stackra/versioning@0.11.1
  - @stackra/database@0.11.1
  - @stackra/model@0.11.1
  - @stackra/config@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/events@0.11.1
  - @stackra/validation@0.11.1
  - @stackra/locking@0.11.1
  - @stackra/queue@0.11.1

## 0.11.0

### Patch Changes

- @stackra/actions@0.11.0
  - @stackra/versioning@0.11.0
  - @stackra/database@0.11.0
  - @stackra/model@0.11.0
  - @stackra/config@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/events@0.11.0
  - @stackra/validation@0.11.0
  - @stackra/locking@0.11.0
  - @stackra/queue@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
- Updated dependencies [aea9b1d]
  - @stackra/config@0.10.0
  - @stackra/contracts@0.10.0
  - @stackra/database@0.10.0
  - @stackra/actions@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/locking@0.10.0
  - @stackra/queue@0.10.0
  - @stackra/versioning@0.10.0
  - @stackra/model@0.10.0
  - @stackra/container@0.10.0
  - @stackra/events@0.10.0
  - @stackra/validation@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [e80a99b]
- Updated dependencies [2e43c48]
- Updated dependencies [b174a17]
- Updated dependencies [f9c825d]
  - @stackra/validation@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/model@0.9.0
  - @stackra/container@0.9.0
  - @stackra/database@0.9.0
  - @stackra/queue@0.9.0
  - @stackra/actions@0.9.0
  - @stackra/versioning@0.9.0
  - @stackra/config@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/events@0.9.0
  - @stackra/locking@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [928dcc0]
- Updated dependencies [7dd35b3]
  - @stackra/database@0.8.0
  - @stackra/container@0.8.0
  - @stackra/locking@0.8.0
  - @stackra/queue@0.8.0
  - @stackra/actions@0.8.0
  - @stackra/versioning@0.8.0
  - @stackra/model@0.8.0
  - @stackra/config@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/events@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/actions@0.7.1
  - @stackra/versioning@0.7.1
  - @stackra/database@0.7.1
  - @stackra/model@0.7.1
  - @stackra/config@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/events@0.7.1
  - @stackra/validation@0.7.1
  - @stackra/locking@0.7.1
  - @stackra/queue@0.7.1

## 0.7.0

### Patch Changes

- @stackra/actions@0.7.0
  - @stackra/versioning@0.7.0
  - @stackra/database@0.7.0
  - @stackra/model@0.7.0
  - @stackra/config@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/events@0.7.0
  - @stackra/validation@0.7.0
  - @stackra/locking@0.7.0
  - @stackra/queue@0.7.0

## 0.6.1

### Patch Changes

- @stackra/actions@0.6.1
  - @stackra/versioning@0.6.1
  - @stackra/database@0.6.1
  - @stackra/model@0.6.1
  - @stackra/config@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/events@0.6.1
  - @stackra/validation@0.6.1
  - @stackra/locking@0.6.1
  - @stackra/queue@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [fb29d41]
  - @stackra/database@0.6.0
  - @stackra/queue@0.6.0
  - @stackra/locking@0.6.0
  - @stackra/actions@0.6.0
  - @stackra/versioning@0.6.0
  - @stackra/model@0.6.0
  - @stackra/config@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/events@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [4fa949b]
  - @stackra/database@0.5.1
  - @stackra/locking@0.5.1
  - @stackra/queue@0.5.1
  - @stackra/actions@0.5.1
  - @stackra/versioning@0.5.1
  - @stackra/model@0.5.1
  - @stackra/config@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/events@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- @stackra/actions@0.5.0
  - @stackra/versioning@0.5.0
  - @stackra/database@0.5.0
  - @stackra/model@0.5.0
  - @stackra/config@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/events@0.5.0
  - @stackra/validation@0.5.0
  - @stackra/locking@0.5.0
  - @stackra/queue@0.5.0

## 0.4.0

### Patch Changes

- 5fc0db7: Listeners are audited like actions. With a bound `ListenerAuditTrail` (`@stackra/events/contracts`), every listener delivery that ended writes one entry: the system actor `sys_listener` that handled it, the event's id as correlation, the event's actor as `causedBy`, and what the listener added with the new `ctx.audit(fields)` (never a classified value), inside the delivery's transaction. `@stackra/actions` ships `OutboxListenerAuditTrailDriver`, which writes it as the same `audit_entry.recorded` event an action call's entry is (`key: listener:<Listener>`).
- Updated dependencies [71b37fc]
- Updated dependencies [7a94bc4]
- Updated dependencies [a7eaed4]
- Updated dependencies [a8c358a]
- Updated dependencies [0b660e0]
- Updated dependencies [0b660e0]
- Updated dependencies [9c8d108]
- Updated dependencies [3c30885]
- Updated dependencies [c9cf778]
- Updated dependencies [1856ee0]
- Updated dependencies [ca7d004]
- Updated dependencies [eccdaf0]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [4f3f1ed]
- Updated dependencies [e070131]
- Updated dependencies [d675b4d]
- Updated dependencies [3df2c07]
- Updated dependencies [2d6bb63]
- Updated dependencies [7dc74f6]
- Updated dependencies [d9bf3c2]
- Updated dependencies [90f55b1]
- Updated dependencies [1c22c33]
- Updated dependencies [688cf0c]
- Updated dependencies [ff56870]
- Updated dependencies [e219411]
- Updated dependencies [79dc807]
- Updated dependencies [5fc0db7]
- Updated dependencies [b970c98]
- Updated dependencies [2bbc0e8]
  - @stackra/actions@0.4.0
  - @stackra/validation@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/database@0.4.0
  - @stackra/queue@0.4.0
  - @stackra/container@0.4.0
  - @stackra/events@0.4.0
  - @stackra/model@0.4.0
  - @stackra/versioning@0.4.0
  - @stackra/config@0.4.0
  - @stackra/errors@0.4.0
  - @stackra/locking@0.4.0

## 0.3.0

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- a60f4e9: The relay and the inbox run each consumer delivery and each receipt through the bound `CallIsolation` as the actor
  stored with the message, change or envelope, in its scope; one stored with none runs as a platform call (STA-1699, ADR
  0495). A run of changes now splits where the actor changes. With none bound they run in `Database.withScope` as before.
- Updated dependencies [a60f4e9]
- Updated dependencies [c4443b5]
- Updated dependencies [b00096a]
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [23e556c]
- Updated dependencies [be75ede]
- Updated dependencies [a60f4e9]
  - @stackra/actions@0.3.0
  - @stackra/database@0.3.0
  - @stackra/config@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/events@0.3.0
  - @stackra/locking@0.3.0
  - @stackra/model@0.3.0
  - @stackra/queue@0.3.0
  - @stackra/validation@0.3.0
  - @stackra/versioning@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [cfdcdf8]
- Updated dependencies [2d5a888]
- Updated dependencies [1a9259b]
- Updated dependencies [9085c41]
  - @stackra/actions@0.2.0
  - @stackra/database@0.2.0
  - @stackra/errors@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/queue@0.2.0
  - @stackra/locking@0.2.0
  - @stackra/versioning@0.2.0
  - @stackra/model@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/events@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 0abe92d: A service's generated `#stackra/boot` now connects `EventBus` (when the service runs `@stackra/events` or
  `@stackra/outbox`) and `InboxService` (with `@stackra/outbox`) after the container is ready, and disconnects both
  when the shutdown signal aborts, so registered listeners, consumed-event subscribers and relays receive events. Add
  `EventBus#disconnect` (removes only the subscriptions `connect` made) and `InboxService#disconnect` (drops the relays).
- fb93026: Erasure fan-out, P0 part (data-layer gap gov6, ADR 0189 decision 2). @stackra/outbox adds `OutboxDriver.holding(value)`
  and `OutboxDriver.rewrite(id, data)` (memory and Postgres drivers; a custom driver must implement both) and
  `redactSubjectMessages(driver, subject, fields)`, which nulls the named fields in every held message, due, retrying or
  dead, whose payload names the subject. @stackra/search adds `SearchForgetService.forget(Model, ids)`, which drops rows
  from the search index and, for a semantic model, the vector index, and `passageIdOf`. @stackra/privacy's erasure saga
  gains a `redact` step before `shred` (its constructor now takes the `OutboxDriver`) and counts rewritten messages in
  the receipt as `outbox.message`; the new `UnindexErasedSubjectListener` removes the subject's remaining rows from search
  after `SubjectErased`.
- 3a9eb7e: Event `Change`s now run on delivery. `@stackra/versioning` adds `publishedVersions(subject, on)`, the older versions
  of an integration event still published before each change's sunset. The `@stackra/outbox` relay publishes an event at
  its current version and then at each of those versions (`<base>.v<from>`, data through `down`) under the same id; the
  inbox lifts an older version with `up` to the class this process has and leaves a newer one unclaimed, so listeners
  run once per id.
- 09080ac: Add the `broker` EventPublisher driver over @stackra/queue's `BrokerPublisher`, and the Postgres stores of the offline
  queue (`PostgresDeviceSequenceStoreDriver`, `PostgresOfflineCapStoreDriver`, `PostgresReplicaLogDriver` scoped by the
  caller's scope path) with migration `outbox.0003_create_offline_stores`.
- 0a20a9f: Outbox change feed (ADR 0078 and 0221, amended 2026-10-28). Row changes go to a retained, day-partitioned
  `outbox.changes` log (migration `outbox.0004_create_changes`) instead of being deleted on delivery; each change
  consumer reads it from its own cursor (`outbox.change_cursors`), with backoff and a stall that drops nothing.
  `RowChange` gains opt-in `before`/`after` values (the new `CapturesChanges({ values, exclude })` trait and
  `changeCaptureOf` in @stackra/model drop encrypted and `@Classified` fields). New: the `ChangeFeed` port with memory
  and Postgres drivers, `ChangeFeedService` (`replay`, `resume`, `backfill`), `ChangeFeed.maintain` (run daily by
  `data_maintenance.change_log.maintain`) and
  `outbox.changeRetentionDays`, `ChangeConsumer.consumeMany` with `coalesceChanges`, and the `@ConsumesChanges(Model)`
  facet, which gen turns into `registerChangeConsumers` rows. @stackra/database adds `NativeWriteWatcher` and
  `connectNativeWriteWatcher`, so `CrudService`'s native verbs report their rows to the feed.
- 2787c1e: Add `@stackra/outbox`: the transactional outbox, with the ORM flush writer that stores integration events and watched
  row changes in the producer's transaction, the relay that publishes them under a lock with backoff retries and dead
  letters, inbox deduplication by event id, the `OutboxDriver`, `InboxDriver` and `EventPublisher` ports with memory and
  Postgres drivers, the `EventOutbox` driver, `registerEventNames`, `registerChangeConsumers` and `OutboxConfig`.
- 3d34a5d: The change log maintenance and outbox prune jobs move to the add-on `@stackra/data-maintenance` (ADR 0462 decision 1),
  which holds their system-held permissions. `./node` no longer exports `MaintainChangeLogAction`, `PruneOutboxAction` or
  their input and output schemas; `.` adds `pruneOutbox(outbox, inbox, days, now)`, the work the prune job calls.
- 6745073: Retention engine (ADR 0134 decision 3, ADR 0189 decision 4). @stackra/model adds the
  `Retention({ keep, basis, policy: "archive" | "soft" | "hard" })` trait. @stackra/database adds `pruneRecords` and
  `pruneAllRecords`, which the nightly per-scope `data_maintenance.record.prune` job of `@stackra/data-maintenance` runs:
  expired rows are archived, soft-deleted or deleted in
  keyset chunks that ask the `HoldRegistry` with `Disposal.Retention`, and every `SoftDeletes` model's rows deleted
  more than 30 days ago are purged. @stackra/outbox adds `OutboxDriver.pruneDead`, the `outbox.pruneAfterDays` setting
  and `pruneOutbox`, which the daily `data_maintenance.outbox_message.prune` job runs to delete old dead letters and
  inbox ids.

### Patch Changes

- cc8db5e: Move the integration events' wire-name registry, `registerEventNames` and `EVENT_NAMES`, from `@stackra/outbox` down
  to `@stackra/events` (STA-1387). `@stackra/outbox` re-exports both, so its writers, inbox and existing callers are
  unchanged. Gen's `.stackra/gen/registrations.ts` now imports `registerEventNames` from `@stackra/events`, so a package
  below the outbox (`@stackra/actions`, with `AuditEntryRecorded` and `UsageRecorded`) registers its integration events
  without declaring `@stackra/outbox`, which would close a package cycle; gen no longer refuses it with
  `generated_dependency_missing`.
- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- 8c7a376: One public-id minter (STA-1380, ADR 0135). `@stackra/contracts` exports `mintPublicId(prefix, time?)`: the prefix and
  the lowercase Crockford base32 of a UUIDv7, in minting order within one process (also within one millisecond and when
  the clock steps back). `@stackra/model`'s `HasPublicId`, `@stackra/actions`' audit and usage events and
  `@stackra/outbox`'s writer all mint with it, so every `evt_` id has one form. The internal minters of actions (random
  lowercase), outbox (uppercase ULID) and model are removed. Ids already stored in the older forms keep working: the
  outbox's `evt_` check and the inbox's claim compare ids as strings.
- 150fa18: The relay's retry wait is the contracts `backoffDelay` over the queue's `JOB_BACKOFF`, unchanged. (stackra-223)
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [f81699d]
- Updated dependencies [f7fb4ad]
- Updated dependencies [e7a388a]
- Updated dependencies [68dd2a5]
- Updated dependencies [e0f2fc8]
- Updated dependencies [2787c1e]
- Updated dependencies [df3f38b]
- Updated dependencies [4413118]
- Updated dependencies [a6ec591]
- Updated dependencies [38fb3e2]
- Updated dependencies [0abe92d]
- Updated dependencies [bc4acfc]
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [99665bb]
- Updated dependencies [8ead1a8]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [94ae85f]
- Updated dependencies [dddbbcd]
- Updated dependencies [856995c]
- Updated dependencies [e7ee0a4]
- Updated dependencies [ca85d59]
- Updated dependencies [d72a734]
- Updated dependencies [9841d79]
- Updated dependencies [f6d1a76]
- Updated dependencies [c196bc6]
- Updated dependencies [49ab0e6]
- Updated dependencies [d156aa8]
- Updated dependencies [6d46e5e]
- Updated dependencies [2787c1e]
- Updated dependencies [38a5501]
- Updated dependencies [e0f2fc8]
- Updated dependencies [62c7ae1]
- Updated dependencies [c868bad]
- Updated dependencies [0d36f0d]
- Updated dependencies [a701ccb]
- Updated dependencies [a526605]
- Updated dependencies [da8bdbd]
- Updated dependencies [763e901]
- Updated dependencies [936fcb1]
- Updated dependencies [f11cbe8]
- Updated dependencies [f7a2d36]
- Updated dependencies [6bb8ea8]
- Updated dependencies [e45cd73]
- Updated dependencies [6006b78]
- Updated dependencies [483eb44]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [3a9eb7e]
- Updated dependencies [cc8db5e]
- Updated dependencies [e7a388a]
- Updated dependencies [2787c1e]
- Updated dependencies [6f2c1f7]
- Updated dependencies [3d080e7]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [2787c1e]
- Updated dependencies [484dc58]
- Updated dependencies [396e384]
- Updated dependencies [d5e5ff8]
- Updated dependencies [9841d79]
- Updated dependencies [d156aa8]
- Updated dependencies [2787c1e]
- Updated dependencies [c580aa4]
- Updated dependencies [7e60fa9]
- Updated dependencies [b62c042]
- Updated dependencies [e52a367]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [0a20a9f]
- Updated dependencies [d5f5acf]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3d0354e]
- Updated dependencies [4ca7b80]
- Updated dependencies [6d0152d]
- Updated dependencies [1e26ab8]
- Updated dependencies [d72a734]
- Updated dependencies [2787c1e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [ae9621e]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [a31d463]
- Updated dependencies [158f6cf]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [c3ff8a7]
- Updated dependencies [3e2fc84]
- Updated dependencies [5e8114b]
- Updated dependencies [2c0ea71]
- Updated dependencies [ab9cc36]
- Updated dependencies [f04fec9]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/events@0.1.0
  - @stackra/locking@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/database@0.1.0
  - @stackra/model@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/versioning@0.1.0
  - @stackra/queue@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
