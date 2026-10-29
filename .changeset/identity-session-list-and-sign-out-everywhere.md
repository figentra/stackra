---
"@stackra/identity": minor
---

Add the session list and "sign out everywhere" (STA-1580). `IdpAdmin.listSessions(userId)` answers a user's live
provider sessions as the new `IdpSession` (id, `createdAt`, `lastActiveAt`, the device's `userAgent`), through the v2
session search in `ZitadelIdpAdminDriver` and in `MemoryIdpAdminDriver` (`openSession(userId, userAgent?)`).
`@stackra/identity/node` adds `ListMySessionsQuery`, `EndMySessionAction` (refuses a session that is not the caller's
as `NotFoundError`), `EndAllMySessionsAction` and the audited admin `EndUserSessionsAction`, with `SessionPermissions`
(ADR 0462) and their schemas. A driver of `IdpAdmin` outside this package must add `listSessions`.
