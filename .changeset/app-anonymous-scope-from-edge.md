---
"@stackra/app": minor
"@stackra/contracts": minor
---

An anonymous call acts in the tenant the edge Worker signed (`EdgeHeader.Scope`, ADR 0437): `EdgeHeaderGuard` records
the scope once the signature and the request id verify, and `serveGuardedCall` gives it to the anonymous actor as its
`scopeId`, its visitor id kept. A credential's tenant wins; a token or an API key whose tenant differs from the signed
one is refused with the generic 403; no signed scope means no tenant. A signed scope that is not an `scp_` public id
is refused (fail closed). `@stackra/contracts` adds `isPublicId(value, prefix)`, a type guard for a string in public id
form.
