---
"@stackra/identity": minor
---

Add step-up (`AssuranceLevel`, `assuranceOf`, `requireAssurance`, `stepUpSignIn`, `StepUpRequiredError`) and sign-in
options on `SessionStore.signIn` and `SessionService.signIn`; external identity providers per market from the market
pack (`signInProvidersOf`, `externalSignIn`); the `./native` (`ExpoSignInBrowserDriver`) and `./desktop`
(`ElectronSignInBrowserDriver`) entries; staff PIN quick-switch and manager override (`StaffPinService`, the
`StaffPinStore` port with storage and memory drivers); publishable, origin-bound API keys (`ApiKeyKind`, `mintApiKey`,
`parseApiKey`, `checkPublishableKey`, `isOriginAllowed`); a guardian acting for a minor (`GuardianActingService`, the
`Guardianship` port); and the KYC and KYB `Verification` port with `VerificationService`, which picks providers from
market-pack data. `IdentityConfig` gains the settings these read.
