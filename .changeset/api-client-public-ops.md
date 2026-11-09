---
"@stackra/contracts": minor
"@stackra/actions": minor
"@stackra/iam": minor
---

A ninth actor kind, `ActorKind.ApiClient` (`api_client`): a tenant's server calling with an API key. An action or query
declares `public: true` or `public: { scopes, publishable }` to answer one; every other operation refuses it, and so
does a call without a key. `CallOptions.credential` carries the verified key (id, scopes, publishable, version pin) onto
the descriptor with `descriptor.public` (the required scopes and whether only exact keys count: L3 and above, approval
or step-up). iam's `AccessControl` checks an `api_client` call's scopes (`keyCovers`: exact keys, or selectors below
L3); a publishable key calls a public write only when it opts in.
