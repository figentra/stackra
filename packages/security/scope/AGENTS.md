# AGENTS — @stackra/scope

The scope tree: levels as data, the node table, the tree, resolver and grant ports, the resolver chain and the client's
active scope (ADR 0327). Member at `packages/security/scope` (`tier:lib`), in the programming model v3.1 shape (ADR
0294, 0305). Entries `.`, `./contracts`, `./node`, `./react`.

## Where code goes

| You are writing…                        | It goes in…                                               |
| --------------------------------------- | --------------------------------------------------------- |
| The configuration (`ScopeConfig`)       | `src/config/scope.config.ts`                              |
| Its options shape                       | `src/core/schemas/scope-options.schema.ts`                |
| Its shipped zod schema (`ScopeConfig$`) | `src/core/constants/scope-config-schema.constant.ts`      |
| A port or a public type                 | `src/contracts/{ports,types}/`                            |
| An isomorphic driver, function, refusal | `src/core/{drivers,functions,errors}/`                    |
| The model, its service, a server driver | `src/node/{models,services,drivers}/`                     |
| A migration                             | `src/node/database/migrations/<NNNN>-<name>.migration.ts` |
| An entitlement                          | `src/node/access/<name>.entitlement.ts`                   |
| An event                                | `src/node/events/<name>.event.ts`                         |
| A hook                                  | `src/react/scope/`                                        |
| A test                                  | `__tests__/<name>.<kind>.test.ts` beside it               |

## Entries and barrels

- `src/{core,contracts,node,react,native,testing}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add
  every new public file to its barrel and to that entry's `index.test.ts`.
- `src/contracts/` is the leaf; `core` imports `contracts`; `node` and `react` import `core` through `#core/index`.
- `ScopeConfig$` mirrors `ScopeOptions` by hand until gen compiles this package's schemas; change both together. Every
  field keeps a default and there is no object-level refinement, so gen's override schema can `.extend` it.
- `ScopeRef` is `@stackra/contracts`'; import it from there and never re-export it (one home per symbol).
- `useScope` serves web and native from `./react`. `./native` holds device-only code (`rememberActiveScope`, the
  remembered scope across launches); `./testing` holds `scopeRefOf` and `fakeScopeTree` and imports no other package's
  `./testing`.
- The package is public (gate A): it has no `private` flag; a breaking change needs a major changeset.

## This package

- No vocabulary of tenancy's level anywhere here (R-59, ADR 0323): the level another package contributes is data in
  the deployment's `ScopeConfig`, never a default, an identifier or a comment in this package.
- Levels are data: never an enum column, a check constraint or a code branch per level.
- Isolation is the database's: never add an application-level `WHERE` filter on scope (ADR 0327 d9).
- `X-Scope-Path` is untrusted: validate it with `isScopePath` and accept it only within a grant; drop it, never refuse.
- A subtree move (`ScopeNodeService.move`) re-paths `scope.scope_nodes` itself and records `ScopeMoved`; every other
  table's rows are re-pathed by the service that owns them, from its listener, through `CrudService.repath` (ADR 0411).
- Raw SQL lives only in `ScopeNodeService` methods, parameterised with `sql`, with a `// raw-sql:` comment (ADR 0160).
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data         | Where                                    | Handling                                                           |
| ------------ | ---------------------------------------- | ------------------------------------------------------------------ |
| Node name    | `scope.scope_nodes.name`, `ScopeEntry`   | An organisation's display name, not personal data; never logged.   |
| Caller       | `ScopeRequest.actor`, `GrantedScopes.of` | A public id passed to the grant driver; never stored or logged.    |
| Scope header | `ScopeRequest.header`                    | Untrusted input, validated and dropped when not granted; not kept. |
