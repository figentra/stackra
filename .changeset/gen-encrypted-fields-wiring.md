---
"@stackra/gen": minor
---

A service's generated boot adds `new EncryptedFieldsSubscriber(container.get(FieldCipher))` to the database
subscribers when any model, own or a declared package's, has `HasEncryptedFields`, so encrypted fields are never
written in clear. New full-pass refusals (`checkEncryptedFields`): `encrypted_field_unknown`,
`encrypted_field_unclassified` and `encrypted_native_write` (a native, query-builder or raw SQL write on an encrypted
model). `FieldIR` carries the `@Classified` code (`classified`) and `MemberIR` the writes that skip the unit of work
(`nativeWrites`) (stackra-262).
