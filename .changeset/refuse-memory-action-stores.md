---
"@stackra/actions": minor
"@stackra/runway": minor
"@stackra/repo-checks": minor
---

A deployed app no longer keeps Idempotency-Keys or rate-limit buckets in process memory (STA-2798). `StoresConfig`
reads `STACKRA_ENVIRONMENT` (new field `environment`, the closed `StoreEnvironment` enum; unset reads as `dev`), and in
`preview`, `staging` or `production` a `memory` idempotency or rate-limit store fails boot with `ConfigInvalidError`
naming the field: the memory store forgets every key on a restart, so a retried write ran twice, and kept one set of
buckets per instance. `dev` and `test` keep the memory default. A misspelt environment now fails config instead of
running as `dev`.

Before you deploy, set both stores in runway, for example in the root's `defaults.service.config` of each deployed
environment:

```yaml
config:
  actions.stores: { idempotency: postgres, rateLimit: postgres }
```

`runway validate` and `stackra validate --repository` report the same thing first: the new `checkActionStores(root,
service, manifest)` of `@stackra/runway` names each deployed environment of a service, whose committed manifest binds
`actions.IdempotencyStore` or `actions.RateLimitStore`, that does not select `postgres` or `valkey`.
