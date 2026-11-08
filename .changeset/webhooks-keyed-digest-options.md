---
"@stackra/webhooks": minor
"@stackra/integrations": patch
---

`keyed_field_digest` takes four optional recipe fields, each defaulting to today's behaviour so existing recipes are
unchanged: `secretAt: "start" | "end"` (default `end`), `separator` (default nothing), `algorithm` now also `SHA-1`,
and `bodyFormat: "json" | "form"` (default `json`), where a form body is read as
`application/x-www-form-urlencoded` with its values percent-decoded. A missing value is an empty string.
`WebhookSchemeRecipe` gains the fields.
