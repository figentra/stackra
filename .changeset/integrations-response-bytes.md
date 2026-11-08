---
"@stackra/integrations": patch
---

`RequestOptions.bytes`: a managed client call can read the answer as raw bytes (a `Uint8Array`) instead of parsing it
as JSON, for a provider that returns a label PDF or an image. The call asks for any media type unless it sets
`accept`. A refusal's body is still read for the provider's code.
