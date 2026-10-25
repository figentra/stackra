# @stackra/scope

The Stackra scope tree: the one hierarchy settings, IAM, feature flags and the other configuration consumers resolve
against (ADR 0327). Levels are deployment data, a node sits on an `ltree` path, a request's scope comes from a resolver
chain, and isolation stays in Postgres row-level security.

**Tier:** `tier:lib` (`packages/security/scope`). Entries `.`, `./contracts`, `./node` and `./react`. Depends on
`@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/database`, `@stackra/entitlements`,
`@stackra/errors`, `@stackra/model` and `@stackra/validation`.

`ScopeRef` (`{ id: PublicId<"scp">; path: string }`) is `@stackra/contracts`'. This package gives it its meaning and
its resolver, and imports it; it never re-exports it.

## What is here

| Entry         | Symbol                                                                             | Use                                                                  |
| ------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `.`           | `ScopeConfig`, `ScopeConfig$`                                                      | the levels in order, the root's path and the level aliases (data)    |
| `.`           | `HeaderScopeResolverDriver`, `ClaimScopeResolverDriver`, `RootScopeResolverDriver` | the steps of the resolver chain                                      |
| `.`           | `ChainScopeResolverDriver`                                                         | the chain: header, claim, root; `scope_unresolved` when none answers |
| `.`           | `MemoryScopeTreeDriver`                                                            | a `ScopeTree` over a fixed list (tests, local runs, a client)        |
| `.`           | `ActiveScopeService`, `SCOPE_PATH_HEADER`                                          | the client's current scope and the one header that carries it        |
| `.`           | `SCOPE_PATH_CLAIM`                                                                 | the token claim the claim step reads (identity writes it)            |
| `.`           | `childLevelsOf`, `isScopePath`, `isWithinScope`, `scopeLevelLabel`                 | the level rule, the path rule, the grant test, a level's lang key    |
| `.`           | `ScopeUnresolvedError`, `ScopeLevelInvalidError`, `ScopeLabelInvalidError`         | refusals                                                             |
| `./contracts` | `ScopeTree`, `ScopeResolver`, `GrantedScopes`                                      | the ports                                                            |
| `./contracts` | `ScopeEntry`, `ScopeLevel`, `ScopeNodeDraft`, `ScopeRequest`                       | types                                                                |
| `./node`      | `ScopeNode`, `ScopeNodeService`, `PostgresScopeTreeDriver`                         | the node table, adding nodes, the server's `ScopeTree`               |
| `./node`      | `ScopeDepthEntitlement`                                                            | the plan right that bounds the tree's depth (declared only)          |
| `./react`     | `useScope`                                                                         | the active scope in a component, web and native                      |

## Levels are data

```ts
// src/overrides/scope/scope.config.ts of a deployment
import { ScopeConfig as BaseScopeConfig } from "@stackra/scope";

export class ScopeConfig extends BaseScopeConfig {
  override levels = [...this.levels, { key: "store", recursive: true }];
  override aliases = { product: "app::scope.brand" };
}
```

The defaults are `platform` then `product`, rooted at `platform`. A node stores its level's key as text, so a level
added here needs no code and no migration. A child takes its parent's level when that level is recursive, else the next
one (`childLevelsOf`). Another package contributes its own level the same way, as data in the deployment's
configuration. An alias is a lang key; a level without one reads `scope::levels.<key>` from `assets/lang/`.

## Nodes

`scope.scope_nodes` holds `id` (the scope id, `scp_…`), `level`, `scope_path` (`ltree`, unique, GiST-indexed) and
`name`. The path is the tree: ancestors are its prefixes and descendants the paths below it. Row-level security matches
`scope_path` at or below the session's `app.scope_paths`, which `Database.withScope(granted, work)` sets, so a session
reads and writes only inside its granted subtrees. No application code adds a `WHERE` filter.

```ts
const root = await nodes.add({ level: "platform", label: "platform", name: "Platform" });
await nodes.add({
  parent: { id: root.id, path: root.scopePath },
  level: "product",
  label: "acme",
  name: "Acme",
});
```

A label is 1 to 63 of `a-z`, `0-9` and `_`; the root's label is `ScopeConfig.root`.

## Resolving a request

```ts
const scope = await chain.resolve({
  actor,
  header: headers.get(SCOPE_PATH_HEADER) ?? undefined,
  claim: verifiedClaims[SCOPE_PATH_CLAIM], // a string, or undefined when the token carries none
});
await database.withScope(scope, () => pipeline.execute(type, input, { actor }));
```

1. `X-Scope-Path`: accepted only when it is a scope path at or below a path the caller holds a grant for
   (`GrantedScopes`), and dropped otherwise, never refused.
2. The verified token's scope path claim, `SCOPE_PATH_CLAIM` (`urn:stackra:scope_path`), which identity's
   `IDENTITY_CLAIMS.scopePath` re-uses.
3. The root at `ScopeConfig.root`, which row-level security shows only to a caller granted the root.

No answer refuses `scope_unresolved` (403). A deployment adds a step (tenancy's goes before the root) with a host
override of `ChainScopeResolverDriver` that overrides `steps()`.

## Not here

- Grants and their inheritance: `@stackra/iam` implements `GrantedScopes`.
- Mapping a business record to a node, and row isolation of business tables: the consuming package (tenancy keeps its
  own equality policy, ADR 0239).
- A key-value table of values per scope: each consumer keeps its own typed table keyed by `scope_id` (ADR 0327 d9).
- Enforcing the depth plan: `ScopeDepthEntitlement` is declared; the check at node creation is planned (ADR 0240).
- The scope on the action context and the audited switch into another scope (ADR 0327 d6): they need a field on
  `@stackra/actions`' call context first.
