# AGENTS — @stackra/query

Server state on the client: the persisted, live TanStack Query cache and the offline mutation queue. Member at
`packages/state/query` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`,
`./contracts`, `./react`, `./testing`.

## Where code goes

| You are writing…           | It goes in…                                    |
| -------------------------- | ---------------------------------------------- |
| A port or a type it names  | `src/contracts/{ports,types}/`                 |
| The configuration          | `src/config/query.config.ts`                   |
| A persister driver         | `src/core/drivers/<name>.driver.ts`            |
| The queue or the cache     | `src/core/services/`                           |
| A record type of the queue | `src/core/types/` (exported from `./react`)    |
| React code                 | `src/react/<name>/`                            |
| A test helper              | `src/testing/functions/`                       |
| A test                     | `__tests__/<name>.<kind>.test.ts(x)` beside it |

## This package

- No sync engine (ADR 0227). Offline writes are action calls replayed with the Idempotency-Key minted at queue time.
  A `client_retry` mints a new key, because the old key would replay the stored refusal.
- A conflict is a record a person resolves, never a silent overwrite (ADR 0059 decision 3).
- Never write "tenant": the cache and the queue are keyed by the principal and a contracts `ScopeRef` (R-59).
- The cache is persisted only through an encrypting persister while `persistEncrypted` is on. The queue is always
  persisted, and `enqueue` resolves only once the call is durable.
- The query hooks of the generated client belong to `@stackra/clients/react`, not here. The `QueueLeader` drivers
  belong to `@stackra/coordinator`, and the `MutationSender` driver to `@stackra/clients`.
- `./contracts` imports no other entry. `src/*/index.ts` are stand-in barrels until gen writes them (STA-339).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

| Data                              | Where                                       | Handling                                                                                             |
| --------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Query results (may hold PII)      | `cache` area, keyed by principal and scope  | Persisted only through an encrypting persister while `persistEncrypted` is on; dropped after max age |
| Queued call inputs (may hold PII) | `outbox` area, keyed by principal and scope | Kept until sent, resolved or discarded; never replayed for another principal                         |
| Principal and scope ids           | storage keys                                | Ids only (public ids and scope codes)                                                                |
