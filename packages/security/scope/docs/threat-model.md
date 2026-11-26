# Threat model: @stackra/scope

<!--
Stackra file contract:
Purpose: the threat model of @stackra/scope: the scope tree, a request's scope resolved from header, token claim and
         root, row-level security by scope path, subtree moves and scope-namespaced cache keys.
Boundary: documentation only; the code wins on any difference. A change that adds an asset, a trust boundary or an
          external call updates this file in the same pull request (constitution SEC10).
Runtime: none
Governing contract: constitution SEC10 and the tenancy law; ADR 0327; ADR 0240; ADR 0411; ADR 0207 (amendment of
                    2026-11-26: the ASVS level); STA-316.
-->

ASVS level: L2 for V4 (access control); L1 for every other chapter (ADR 0207, amendment of 2026-11-26).
Reviewed: 2026-11-26 (STA-316).

Every request runs at a node of the scope tree, and Postgres shows a session only the rows at or below its granted
paths. The threats are a caller acting in a scope it was never granted, and data or cache entries crossing scopes.

## Assets

| Asset                              | Where it lives                                          | Class          |
| ---------------------------------- | ------------------------------------------------------- | -------------- |
| The scope tree (ids, paths, names) | `scope.scope_nodes` (`ltree`, RLS by `app.scope_paths`) | `confidential` |
| A request's scope                  | the call's context, set transaction-locally             | `internal`     |
| Scope-path rows of other models    | every table with `t.scopePath()`                        | `confidential` |
| Cached answers                     | `@stackra/cache`, namespaced by scope id                | `confidential` |

## Trust boundaries

1. The client's `X-Scope-Path` header (untrusted) to `HeaderScopeResolverDriver`.
2. The verified token's scope claim to `ClaimScopeResolverDriver`.
3. This package to Postgres through `Database.withScope`.
4. `ScopeMoved` events to every service's re-path listener.

## Threats and controls

| Threat                                                             | Control today                                                                                                                          | Open work                                                 |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| A client claims a scope through the header                         | The header counts only at or below a path the caller holds a grant for (`GrantedScopes`); otherwise it is dropped, never trusted       | —                                                         |
| No scope resolves and the call runs everywhere                     | No answer refuses `scope_unresolved` (403); the root is shown only to a caller granted the root                                        | —                                                         |
| A query forgets its scope filter                                   | Row-level security on `scope_path` at or below `app.scope_paths`; no application code adds the filter                                  | Isolation proven for queue, outbox and workflow, STA-1717 |
| A scope setting leaks into the next request on a pooled connection | Settings are `set_config(..., true)`, transaction-local; validate refuses a session-level one                                          | —                                                         |
| One scope reads or overwrites another's cache entry                | `ScopeCacheNamespaceDriver` puts every key behind the running call's scope id                                                          | —                                                         |
| A subtree move leaves rows behind or under the wrong parent        | One-statement path rewrite; `scope_move_invalid` and `scope_level_invalid` refusals; every opted-in model re-pathed in one transaction | —                                                         |
| A label injects into an `ltree` path                               | Labels are 1 to 63 of `a-z`, `0-9` and `_`, checked before writing                                                                     | —                                                         |
