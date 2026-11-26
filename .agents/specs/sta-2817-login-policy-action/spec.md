# Feature Specification: a tenant's login policy and MFA enforcement as an audited admin action

**Feature Branch**: `figentra/sta-2817-login-policy-action`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: CTO (security-relevant: how a whole tenant signs in)

**Linear**: STA-2817

**Clarifications status**: complete

**Input**: STA-2817, batch 10 of the 26 Nov readiness backlog ("Expose per-tenant MFA enforcement and login policy as
an audited admin action"). `ZitadelIdpAdminDriver.setLoginPolicy` existed, but no action or permission called it, so
"MFA required" for a tenant was a ZITADEL console setting the product could not set, show or audit. Only the staff
(operator) organisation forced a second factor, in `@stackra/infra-identity` code. ADR 0207 decision 1 asks for an MFA
policy per tenant; ASVS 4.0.3 V2 at L2 expects MFA to be enforceable.

### Sources

- `packages/security/identity/src/core/drivers/zitadel-idp-admin.driver.ts` (`setLoginPolicy`)
- `packages/infrastructure/infra-identity` (`identity-stack.function.ts`: the staff organisation's forced MFA)
- ADR 0207 (decision 1), ADR 0410 (decision 4), ADR 0462, ADR 0294 (decisions 16 and 21), ADR 0099
- ZITADEL management API v1: `/management/v1/policies/login` (add, update, idps, second factors; `forceMfaLocalOnly`)

## Impact

- **Apps touched**: none (a host wires `IdpOrganizations` to its tenant-to-organisation map to expose the calls)
- **Services touched**: none in this repo; the identity service of a product registers the two calls
- **Packages touched**: identity (`@stackra/identity`): contracts, core drivers, node actions, manifest, i18n
- **Public contract change**: new `IdpOrganizations` port and `IdpOrganization` type; `IdpAdmin.getLoginPolicy`;
  `LoginPolicyRejection` enum and `LoginPolicyRejectedError`; `SetLoginPolicyAction` (`identity.login_policy.set@1`),
  `ShowLoginPolicyQuery` (`identity.login_policy.read@1`), `LoginPolicyPermissions`; manifest entries for each
- **Cross-service events**: none
- **Tenancy and data**: the organisation comes from the session's scope through the host's `IdpOrganizations`, only
  at the node the organisation belongs to (the tenant's root); nothing in the input names an organisation, tenant or
  scope; a descendant's grant never reaches the whole tenant
- **Security and privacy**: `set` is L3 with an `aal2` step-up; the audit holds the rules and provider-side ids only,
  never a person; the ZITADEL writes run in an order that never locks a tenant out; a forced second factor covers
  users who sign in through an external provider (`forceMfaLocalOnly: false`)
- **Secrets**: none new (the driver's existing service-account token)
- **ADR needed**: no (implements ADR 0207 decision 1 and ADR 0410 decision 4)
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none in this repo (a product's security settings screen calls the query and the action)
- **Docs to update**: `packages/security/identity/README.md` ("Login policy: MFA enforcement"), the package
  `AGENTS.md`, the identity threat model's MFA row (`docs/threat-model.md`, added by STA-316)
- **Lane**: full
- **Change risk**: R3 (a tenant's sign-in rules; a wrong write could lock a tenant out)

## Acceptance criteria

- **AC-001**: WHEN a caller holding `identity.login_policy.set` with a fresh `aal2` step-up sets a policy at the
  tenant's root scope THE action SHALL push it to that scope's identity provider organisation and answer the policy now
  in force.
- **AC-002**: THE set action SHALL audit the policy before and the one attempted, before any provider write, with the
  rules and provider-side ids only.
- **AC-003**: WHEN the call has no scope, the scope has no organisation, or the scope is not the node the organisation
  belongs to (a descendant) THE query and the action SHALL refuse with `NotFoundError`.
- **AC-004**: WHEN a policy leaves no sign-in method, forces a second factor while none is offered, or names a provider
  outside `IdentityConfig.externalProviders` THE action SHALL refuse with `LoginPolicyRejectedError` before any
  provider write.
- **AC-005**: THE query SHALL answer the policy the organisation applies now (its own or the inherited default), with
  the providers and second factors it offers, for a caller holding `identity.login_policy.read`.
- **AC-006**: THE ZITADEL driver SHALL write the rules, factors and providers in an order where a failure part way
  leaves a looser policy, never a forced second factor with none offered or no sign-in method.
- **AC-007**: WHEN a policy forces a second factor THE ZITADEL driver SHALL force it for users who sign in through an
  external provider too (`forceMfaLocalOnly: false`), and a provider policy that forces it on local sign-ins only SHALL
  read as not forced.
- **AC-008**: THE driver SHALL keep the provider's settings Stackra does not manage (check lifetimes, redirect,
  login-name switches) on every add or update, and read every page of the linked providers.

## Status history

- 2026-11-26 → Clarified (the organisation is the session's, at the tenant's root only; MFA forced for everyone)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md; built in the same branch)
- 2026-11-26 → Implementing (PR stackra-inc/stackra#1124)
