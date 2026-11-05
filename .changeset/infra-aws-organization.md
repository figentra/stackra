---
"@stackra/infra-aws": minor
---

The management account's building blocks (STA-2115, ADR 0524): `organizationLayout` (the organization's trusted
services, policy types, root access, units by path and policies with their targets), `productAccount` (account
vending: account, unit, opt-in region, budget, sign-in roles and their Account Access Manager entitlements),
`accessRoles`, and `regionLock` with `GLOBAL_ACTIONS` for the region SCPs.
