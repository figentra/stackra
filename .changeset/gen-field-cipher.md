---
"@stackra/gen": patch
---

A service with encrypted fields (a `HasEncryptedFields` model, its own or a declared package's) boots. Its generated
boot seals them with `FieldCipher`, but the cipher's one implementation, `AesGcmFieldCipherDriver` in
`@stackra/contracts`, is a plain class no manifest lists as a driver, so nothing bound it ("No driver is bound to
FieldCipher"). The generated wiring now binds `FieldCipher` to it over `KeyProvider`, and links the `KeyProvider`
drivers of a declared package (`@stackra/tenancy`: `ephemeral` by default, `kms` in production). Regenerate
(`stackra gen`); a service with encrypted fields declares `@stackra/tenancy`.
