---
"@stackra/model": minor
---

Add field encryption (owner decision 23, gap R-36): the `HasEncryptedFields(...fields)` trait names a model's string
fields that rest encrypted, `encryptedFieldsOf(Model)` reads them, and `EncryptedFieldsSubscriber`, an ORM subscriber
built with the `FieldCipher` port, seals them before a create, update or upsert and opens them on load under the
context `<model key>.<field>`. A null stays null. Hosts pass the subscriber in `DatabaseOptions.subscribers` until the
generated boot registers it (STA-339).
