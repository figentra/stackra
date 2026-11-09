---
"@stackra/gen": patch
---

An action or query whose actors include `ActorKind.ApiClient` (`api_client`) now gets an endpoint, derived or written. An API-key caller such as a tenant's servers reaches the service like a user. Before, a `public` action whose only external actor was `api_client` got no route, and strict gen refused it with `public_without_endpoint`, even with an explicit `endpoint` (BILLING-B, `meters.usage_event.record_batch@1`). An action for services alone still gets none.
