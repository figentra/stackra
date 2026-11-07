---
"@stackra/app": minor
"@stackra/contracts": minor
"@stackra/tenancy": minor
---

A service can now call for a user (ADR 0209, amendment of 2026-11-07). The calling service sends its own token as
`Authorization: Bearer` and the user's own access token in `Stackra-On-Behalf-Of`. `CallAuthenticator` verifies both
with the same issuer, audience and leeway, and the call becomes the service acting for that user:
`{ kind: "service", id: "svc_…", scopeId?, onBehalfOf: <the user> }`. The forwarded token itself is never kept; only
the user it names travels. A forward is refused when it sits beside a user token or no token, when it has expired or
names another audience, when it is a service's token, or when the service is bound to a tenant other than the user's.

The call then runs in the user's tenant: `actingScopeId` gives a service with no tenant of its own the tenant of the
user it calls for, as it already did for an agent. `CallIsolationDriver` treats a service like an agent: it refuses
one whose own tenant differs from its user's, and one with a tenant whose scope sits above every tenant or is not in
the scope tree (`tenant_scope_mismatch`). A service with no tenant and no user stays a platform call, as before.
