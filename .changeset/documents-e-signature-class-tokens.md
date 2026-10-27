---
"@stackra/documents": minor
---

`ConnectionESignatureDriver`'s constructor takes the `ProviderResolver` only (class tokens, STA-1365). The provider
map is the `protected readonly drivers` member, `{ documenso: DocumensoConnection }` by default; a host subclasses the
driver and overrides `drivers` with its own map instead of passing it to the constructor.
