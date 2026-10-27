---
"@stackra/licensing": minor
---

The `registry` `LicenceIssuer` driver, now the default (ADR 0453 decision 15): `RegistryLicenceIssuerDriver` sends
every `RegistryLicenceCommand` to the Stackra registry licence API with its Idempotency-Key and maps the port's
`create`, `update` and `suspend` onto it; `checkOut` is refused (on-prem files stay with the `keygen` driver, now
optional). `IssuerConfig` gains `registryUrl` and the `REGISTRY_ISSUER_TOKEN` secret `issuerToken`. New `./contracts`
entry: `RegistryLicenceCommand`, `RegistryLicence`, `RegistryLicenceGrant`, `RegistryLicenceToken`.
