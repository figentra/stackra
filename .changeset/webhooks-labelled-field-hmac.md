---
"@stackra/webhooks": minor
"@stackra/integrations": patch
---

A new `labelled_field_hmac` signature scheme: a hex HMAC (SHA-256 or SHA-512) over each label followed by its body
field's value, in order, carried in a header or a query parameter and compared in constant time
(`verifyLabelledFieldHmac`). The recipe names the fields as `labelledFields: [{ label, path }]` and may set
`currencyDecimals: { path, currencyPath }`, which writes that amount with the minor-unit decimals of the ISO 4217
currency at `currencyPath` from `@stackra/money`'s table (3 for KWD, BHD and OMR, 0 for JPY). A missing field, or an
amount the currency cannot hold, does not verify. `WebhookSchemeRecipe` gains both fields.
