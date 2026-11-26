# Threat model: @stackra/config

<!--
Stackra file contract:
Purpose: the threat model of @stackra/config: deploy-time configuration classes and their layers, `@Secret` fields
         resolved blind through `SecretStore`, the secret-store drivers and the signer drivers.
Boundary: documentation only; the code wins on any difference. A change that adds an asset, a trust boundary or an
          external call updates this file in the same pull request (constitution SEC10).
Runtime: none
Governing contract: constitution SEC6, SEC7 and SEC10; ADR 0146 (as amended); ADR 0173; ADR 0231; ADR 0525; ADR 0207
                    (amendment of 2026-11-26: the ASVS level); STA-316.
-->

ASVS level: L1 for every chapter; V14 (configuration) and V6.4 (secret management) are this package's own (ADR 0207, amendment of 2026-11-26).
Reviewed: 2026-11-26 (STA-316).

Configuration is deploy-time values as classes, validated and frozen at boot; secrets are named on schema fields and
read blind through a `SecretStore`. Code names a secret and never holds its value. The threats are a secret leaking,
a secret reaching a client, and a production service running on test keys or values.

## Assets

| Asset                     | Where it lives                                                                   | Class      |
| ------------------------- | -------------------------------------------------------------------------------- | ---------- |
| Secret values             | the platform's secret store, read into a non-enumerable getter at call time      | `secret`   |
| AWS Secrets Manager reads | memory after `load()`; the runtime's AWS role signs the reads                    | `secret`   |
| Signing keys              | AWS KMS (`kms` driver), never leaving it; an in-process key pair for `ephemeral` | `secret`   |
| Configuration values      | the frozen configuration instances; deploy-time, never per tenant                | `internal` |

## Trust boundaries

1. The deployment (runway values, environment variables) to `buildConfig`.
2. This package to the secret store (the platform's own, or AWS Secrets Manager).
3. The server's configuration to a browser or device build, which sees only public fields.
4. A service to KMS for signatures.

## Threats and controls

| Threat                                                          | Control today                                                                                                                                      | Open work                                                                                                  |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| A secret is logged, serialised or thrown in an error            | `@Secret` values sit in a non-enumerable getter: absent from `JSON.stringify`, `Object.keys`, spreads, `console.log` and errors                    | —                                                                                                          |
| A secret is set through an environment variable or values layer | Setting a secret through `env` or a values layer throws; only the secret store answers it                                                          | —                                                                                                          |
| A secret reaches a browser or an API response                   | A schema with a secret never reaches a wire surface (gen's `secret_on_wire`); browser builds read only `VITE_`, `EXPO_PUBLIC_` and renderer fields | —                                                                                                          |
| Bad configuration starts a service in an unsafe state           | `buildConfig` validates every layer against the schema and freezes the result; a failure stops the boot                                            | Boot with `STACKRA_ENVIRONMENT` and runway values, STA-2799                                                |
| A secret store driver lists or reports values                   | No driver lists, logs or reports a value                                                                                                           | —                                                                                                          |
| A rotated secret keeps the old value until restart              | `load()` again after a rotation, for the AWS driver                                                                                                | Bind the wiring's store at boot and reload it, STA-2804; missing drivers and the secrets manifest, STA-258 |
| Production signs with a throwaway key                           | `SignerConfig.driver` is `ephemeral` unless configured; production sets `kms` in its runway values                                                 | Refuse `ephemeral` in deployed environments, as STA-2798 does for the action stores                        |
| A test secret value runs in production                          | `test-secret:<NAME>` is only what `withConfig` gives inside tests                                                                                  | —                                                                                                          |
