---
"@stackra/identity": patch
---

`MemoryIdpAdminDriver.finishPasskeySignIn` now takes the device's credential as its second argument, as the
`IdpAdmin` port declares, so a caller holding the memory driver passes the same arguments as against ZITADEL.
