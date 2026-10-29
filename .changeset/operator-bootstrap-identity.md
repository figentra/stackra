---
"@stackra/identity": minor
---

Add the operator bootstrap (STA-1586): `BootstrapOperatorAction` (`identity.operator.bootstrap@1`,
`POST /platform/operators/bootstrap`) gives the user with an email a role (`owner` by default) at the platform node
once, through `@stackra/iam/contracts`' `RoleGrants`, with `dryRun` and the `OperatorBootstrapOutcome` codes
(`granted`, `already_granted`, `would_grant`, `not_found`). `OperatorPermissions.bootstrap` is L4 and system-held, so
only a service principal acting for no one can call it. `IdpAdmin` gains the abstract `findStackraUserId(email)`
(ZITADEL: a v2 user search on the email, then the `stackra_user_id` metadata; the memory driver keeps each user's
email): a custom `IdpAdmin` driver must implement it.
