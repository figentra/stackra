# Threat model: @stackra/integrations

<!--
Stackra file contract:
Purpose: the threat model of @stackra/integrations: Integrations and Connections, the connection stores (local and
         hosted), OAuth token handling, the managed client, the provider resolver and the wallet pass signer.
Boundary: documentation only; the code wins on any difference. A change that adds an asset, a trust boundary or an
          external call updates this file in the same pull request (constitution SEC10).
Runtime: none
Governing contract: constitution SEC6, SEC7 and SEC10; ADR 0308; ADR 0348; ADR 0355; ADR 0356; ADR 0443; ADR 0207
                    (amendment of 2026-11-26: the ASVS level); STA-316.
-->

ASVS level: L1 for every chapter (ADR 0207, amendment of 2026-11-26).
Reviewed: 2026-11-26 (STA-316).

An Integration describes a provider once; a Connection is one scope's or user's credential set for it; both call the
provider through the managed client, which authenticates, rate-limits and retries. The threats are a tenant's
credentials leaking or being used by another tenant, and the client being turned against hosts it should not reach.

## Assets

| Asset                                    | Where it lives                                                                    | Class      |
| ---------------------------------------- | --------------------------------------------------------------------------------- | ---------- |
| Connection credentials (keys, secrets)   | `@Secret` fields; the hosted store host's vault (encrypted), or memory locally    | `secret`   |
| OAuth access and refresh tokens          | `IntegrationRuntime` memory per credential; refresh tokens stay on the store host | `secret`   |
| Wallet pass signing certificate and key  | the secret store, read by `PkijsCmsSignerDriver`                                  | `secret`   |
| Provider answers, documents, transcripts | memory, returned to the caller only                                               | `pii`      |
| Ad match keys                            | SHA-256 hashed by `matchKeysOf` before a connector sees them                      | `pii`      |
| Connected account labels                 | the store's records, shown to the owner                                           | `internal` |

## Trust boundaries

1. An action in a scope to `ConnectionStore.find`, which answers that scope's Connection or the nearest above.
2. The service to the integrations service that hosts credentials (`HostedConnectionStoreDriver`).
3. The managed client to the provider's API.
4. A provider's webhook back in (verified by `@stackra/webhooks` with the secret the Integration names).

## Threats and controls

| Threat                                                   | Control today                                                                                                                              | Open work                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| One tenant's call uses another tenant's Connection       | `find` resolves from the running call's scope and user (`RequestConnectionContextDriver`), never from input                                | —                                                                |
| A credential leaks into a log, an error or an echo       | Secret fields are names, read blind at call time, never enumerable, logged or echoed; `credentialRef` stores a reference, never the secret | —                                                                |
| A service process holds refresh tokens it does not need  | In hosted mode refresh tokens never leave the store host; access tokens live in memory per credential                                      | Secret-store reload on rotation, STA-2804                        |
| The managed client is pointed at an internal host (SSRF) | Every path is joined under the Integration's `baseUrl`; https only, plain http only for `.internal` hosts                                  | —                                                                |
| A slow or failing provider exhausts the service          | Rate limits per Integration and scope, bounded retries with backoff, only for safe methods or with an idempotency header                   | Circuit breakers and load shedding, STA-1467                     |
| A provider refusal leaks the request body or credentials | Refusals are typed (`ProviderRefusedError`, `ProviderUnavailableError`) with the status, never the credentials                             | —                                                                |
| A forged webhook claims a provider event                 | The secret is looked up for the connection in the URL; the signature is checked before parsing                                             | —                                                                |
| Personal data sent to an ad platform in clear            | Match keys are SHA-256 hashed before any connector sees them                                                                               | IP and user agent still pass unhashed (by design of the ad APIs) |
