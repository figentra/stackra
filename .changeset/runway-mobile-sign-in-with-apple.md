---
"@stackra/runway": minor
---

Add `mobile.<app>.signIn.social`, the app's social sign-in providers. A non-empty list without `apple` is refused (App
Store guideline 4.8), and with `apple` `expoConfigOf` sets `usesAppleSignIn` and the
`com.apple.developer.applesignin` entitlement.
