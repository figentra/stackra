---
"@stackra/identity": minor
---

Tenant administrators can read and set their tenant's login policy, including forcing a second factor for everyone:
`ShowLoginPolicyQuery` (`identity.login_policy.read@1`, L1) and `SetLoginPolicyAction` (`identity.login_policy.set@1`,
L3 with an `aal2` step-up, audited before and after). The organisation comes from the session's scope through the
host's new `IdpOrganizations` port (memory driver included); a policy that would lock everyone out or names an
unconfigured provider is refused with `LoginPolicyRejectedError` before any provider write. `IdpAdmin` gains
`getLoginPolicy` (ZITADEL and memory drivers).

`ZitadelIdpAdminDriver.setLoginPolicy` fixes, found against a live ZITADEL: a second change of an organisation's policy
no longer fails with 409 (ZITADEL leaves `isDefault: false` out of its answer, so the driver always re-added the
policy); saving rules already in force no longer fails with `Errors.Org.LoginPolicy.NotChanged`; and the first change
keeps the default's check lifetimes, passkey (multi-factor) setting, second factors and providers instead of resetting
them.

The policy's separate provider writes now run in a sign-in-safe order: the missing second factors and providers are
added first, a forced second factor or a sign-in method turned off is applied only after every addition succeeded,
and the factors and providers no longer listed are removed last (a relaxed rule goes first). A write that fails part
way leaves a looser policy, never a tenant forced to a factor it is not offered or with no way to sign in.

`IdpOrganizations.organizationOf` answers an `IdpOrganization` (the organisation and the scope node it belongs to) and
only for that exact node, never a descendant; both login policy calls refuse with `NotFoundError` unless that node is
the call's own scope, so a grant held at a branch can never change the whole tenant's sign-in rules. The set call
records its audit (the policy before and the one attempted) before the provider writes, so a refused write is still
recorded with what it tried.

A forced second factor covers everyone: `ZitadelIdpAdminDriver` writes ZITADEL's `forceMfaLocalOnly` as `false` with
the rules (it was carried over, so a policy forced on local sign-ins only left external-provider users without a second
factor), keeps it until the added factors are offered, and `getLoginPolicy` reads a policy forced on local sign-ins
only as not forced. The driver also reads every page of the providers a login policy links, not the first 100.
