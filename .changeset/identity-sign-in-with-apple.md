---
"@stackra/identity": minor
---

Add Sign in with Apple (App Store guideline 4.8). `SocialProvider.Apple` is offered by `signInProvidersOf` in every
market once `externalProviders.apple` names ZITADEL's Apple provider, and `externalSignIn("apple", …)` sends the hosted
sign-in there. `./contracts` adds the `AppleSignIn` port with `AppleSignInRefusal`, `AppleCredential` and
`AppleSignInResult`; `./native` adds `ExpoAppleSignInDriver`, which requires `expo-apple-authentication` (a new optional peer, `catalog:mobile`) on use and
throws an error naming it when the app has not installed it. Labels ship in `assets/lang` in seven locales.
