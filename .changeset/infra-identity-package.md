---
"@stackra/infra-identity": minor
---

Add `@stackra/infra-identity` (ADR 0171, ADR 0206): `parseIdentitySeed` checks `.stackra/zitadel/seed.yaml` (the staff
organisation, the project and its roles, one OIDC client per app, the machine users, the dev users and the branding);
`identityPlan` builds the plan of one ZITADEL instance from the root runway's `providers.zitadel` and the seed, with the
callbacks of the environments it serves; `./node` adds `readIdentitySeed` and `identityStack`, the Pulumi slice that
sets the token lifetimes, password rule and branding, and creates the staff organisation with its MFA sign-in policy,
the project, roles, PKCE clients with no secret and machine users, exporting their ids.
