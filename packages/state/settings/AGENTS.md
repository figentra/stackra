# AGENTS — @stackra/settings

Scoped runtime settings: the `Settings` kind, `@Setting`, the reader and its store port, the stored values table, the
generated-key helpers, the native form and the fake (ADR 0307 rules 22 to 24, ADR 0213, ADR 0327). Member at
`packages/state/settings` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`,
`./contracts`, `./node`, `./native`, `./testing`.

## Where code goes

| You are writing…                             | It goes in…                                               |
| -------------------------------------------- | --------------------------------------------------------- |
| The store port or a public value type        | `src/contracts/{ports,types}/`                            |
| A kind base, a decorator, an enum, a refusal | `src/core/{bases,decorators,enums,errors}/`               |
| An isomorphic driver, function or service    | `src/core/{drivers,functions,services}/`                  |
| The model, its service, a server driver      | `src/node/{models,services,drivers}/`                     |
| A migration                                  | `src/node/database/migrations/<NNNN>-<name>.migration.ts` |
| A native component and its props             | `src/native/<name>/<name>.tsx`, `<name>.props.ts`         |
| A fake or a test helper                      | `src/testing/`                                            |
| A lang string                                | `assets/lang/<locale>/settings.json`                      |
| A test                                       | `__tests__/<name>.<kind>.test.ts` beside it               |

## Entries and barrels

- `src/{contracts,core,node,native,testing}/index.ts` are stand-in barrels until gen writes the entry barrels
  (STA-339); add every new public file to its barrel and to that entry's `index.test.ts`.
- `src/contracts/` is the leaf; `core` imports `contracts`; `node` and `native` import `core`; `testing` imports all.
- The layer, lock, value and key-derivation functions and the key registry are internal: other entries import them by
  path, and no barrel exports them.

## This package

- No tenant vocabulary (R-59, ADR 0323): a level another package owns is data, written by the app, never a
  `SettingScope` case, an identifier or a comment here.
- A setting is never a secret: no secret type, no field that holds a credential; a connection is referred to by its id.
- The group key comes from the class name (`<Module>Settings`), as `configKey` derives a configuration's; never add a
  key option.
- `SettingsRules` is a type: gen reads `rules(r)` from the syntax tree. Keep the set closed; a new comparison needs an
  ADR note on 0307.
- The lock check lives in `refuseLockedPaths`, run by every store driver before it writes.
- Raw SQL lives only in `StoredSettingService` methods, parameterised with `sql`, with a `// raw-sql:` comment (ADR
  0160). The scope path comes from the target or the session, never from request input.
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data             | Where                                           | Handling                                                      |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------------- |
| User preferences | `settings.stored_settings` user rows, `user_id` | A person's own choices keyed by a public id; never logged.    |
| Setting values   | `settings.stored_settings.values`               | Configuration, never a secret or classified data; not logged. |
| Scope node       | `scope_id`, `scope_path`                        | A node's id and path, not personal data.                      |
