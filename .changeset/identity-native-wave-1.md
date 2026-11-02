---
"@stackra/identity": minor
"@stackra/showcase": patch
---

`SignIn` on React Native, in `@stackra/identity/native`: the identity kit's sign-in card (ADR 0504) with the same props
as the web block, so one login configuration drives both. It shows the tenant's providers, an email and password form
whose return key submits, "remember me", the forgotten-password and sign-up links, and an announced error; every word
comes from the host in `labels`. It signs nobody in itself: the host starts a provider through the Expo drivers. The
showcase lists it for native as well as web.
