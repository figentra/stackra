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
