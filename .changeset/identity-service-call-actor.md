---
"@stackra/identity": minor
---

`actorOf(claims, principals)` turns a verified access token into the call's `Actor` (ADR 0209 decision 3,
service-to-service calls). A token whose subject is a service account is the `service` actor of its principal, found
through the new `ServicePrincipals` port (`bySubject`, answering a `ServicePrincipal`: a `svc_` id, the
`<product>.<member>` key and the tenant), whatever other claims it carries. Any other token is a `user` actor read from
`urn:stackra:user_id`, the new `urn:stackra:realm` claim (`IDENTITY_CLAIMS.realm`) and the membership matching the
token's scope path. An unknown subject, a missing or mistyped claim, or a scope path outside the memberships is
refused `unauthenticated`. `MemoryServicePrincipalsDriver` serves tests.
