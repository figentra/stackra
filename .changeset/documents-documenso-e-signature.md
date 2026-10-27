---
"@stackra/documents": minor
---

Add the default e-signature connector: `DocumensoIntegration` and `DocumensoConnection` (Documenso self-hosted, API v1,
certification pending) and `ConnectionESignatureDriver`, the `connection` driver of `ESignatureProvider` that picks the
provider per call through `ProviderResolver` (ADR 0356) and keeps follow-ups on the same Connection. Add the
`signature_signer_unreachable` refusal. The package now uses the `decorators` presets. New dependencies:
`@stackra/config`, `@stackra/integrations` (STA-959).
