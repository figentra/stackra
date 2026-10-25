# AGENTS — @stackra/state

Client state as classes (ADR 0079). Member at `packages/state/state` (`tier:lib`), in the programming model v3.1 shape
(ADR 0294, 0305). Entries `.`, `./react`, `./testing`.

## Where code goes

| You are writing…           | It goes in…                                     |
| -------------------------- | ----------------------------------------------- |
| The kind base (`Store`)    | `src/core/bases/store.base.ts`                  |
| The configuration          | `src/config/state.config.ts`                    |
| A function, constant, type | `src/core/{functions,constants,schemas,types}/` |
| React code                 | `src/react/<name>/`                             |
| A test helper              | `src/testing/functions/`                        |
| A test                     | `__tests__/<name>.<kind>.test.ts(x)` beside it  |

## This package

- `set` is the only writer; a field it does not know throws. A persisted store with no registered key refuses to build.
- Storage is the structural `StoreStorage` contract; never import `@stackra/storage` here (it satisfies the contract).
- Server state never lives here: that is `@stackra/query`.
- `src/*/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

| Data        | Where                  | Handling                                                                             |
| ----------- | ---------------------- | ------------------------------------------------------------------------------------ |
| Store state | the chosen client area | Whatever a store declares; never persist a credential or a person's data in a store. |
