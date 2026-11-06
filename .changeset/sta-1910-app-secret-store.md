---
"@stackra/app": patch
---

`bootApp` binds the environment as the `SecretStore` port unless the caller overrides it, so a driver that reads a secret
by name (the cross-app event signer, STA-1910) resolves in a generated service.
