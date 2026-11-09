---
"@stackra/clients": minor
---

`useAction` and `useQuery` now take a `scope` option: the scope path every call of the hook runs in. It is sent in the scope header (`X-Scope-Path`) over the session's scope. So a screen can create a unit under a parent, or list another branch's records, without switching its active scope (CHECKOUT's os screens).

A scoped query's answer is cached apart from the same query in another scope. The query key stays first, so invalidating the query still reaches it. With no `scope`, a call runs in the session's scope and keeps the cache key it had before.
