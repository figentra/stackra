---
"@stackra/actions": minor
"@stackra/runway": minor
"@stackra/repo-checks": minor
---

A deployed app no longer keeps Idempotency-Keys or rate-limit buckets in process memory (STA-2798). `StoresConfig`
gains the field `environment`, mapped to `STACKRA_ENVIRONMENT` and typed as `@stackra/config`'s closed
`StackraEnvironment` (the one environment reader of STA-2844; unset reads as `dev`, a misspelt name fails boot). Where
`isDeployedEnvironment` says the app is deployed (`preview`, `staging`, `production`), a `memory` idempotency or
rate-limit store fails boot with `ConfigInvalidError` naming the field: the memory store forgets every key on a restart,
so a retried write ran twice, and kept one set of buckets per instance. `dev` and `test` keep the memory default. The
environment is runtime-only: a runway `config` block or a test's `values` that sets `actions.stores.environment` fails
boot and `runway validate`, so runway cannot make a deployment read as `dev`.

Before you deploy, set both stores in runway, for example in the root's `defaults.service.config` of each deployed
environment:

```yaml
config:
  actions.stores: { idempotency: postgres, rateLimit: postgres }
```

`runway validate` and `stackra validate --repository` report the same thing first: the new `checkActionStores(root,
service, manifest)` of `@stackra/runway` names each deployed environment of a service, whose committed manifest binds
`actions.IdempotencyStore` or `actions.RateLimitStore`, that does not select `postgres` or `valkey`.
