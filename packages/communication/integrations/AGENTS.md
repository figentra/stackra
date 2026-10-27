# AGENTS — @stackra/integrations

<!--
Stackra file contract:
Purpose: the agent rules of @stackra/integrations: where code goes, entries and barrels, the package rules (connector
         kinds and the capability lookup included) and PII.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0294; ADR 0305; ADR 0308; ADR 0348; ADR 0355; ADR 0356; ADR 0376; ADR 0443; ADR 0447.
-->

Provider integrations, connections and their store (ADR 0308). Member at `packages/communication/integrations`
(`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./node` and
`./testing`.

## Where code goes

| You are writing…         | It goes in…                                 |
| ------------------------ | ------------------------------------------- |
| A kind base              | `src/core/bases/<name>.base.ts`             |
| A port with leaf types   | `src/contracts/ports/<name>.port.ts`        |
| A port that uses `.`     | `src/core/ports/<name>.port.ts`             |
| A store driver           | `src/core/drivers/<name>.driver.ts`         |
| The runtime service      | `src/core/services/<name>.service.ts`       |
| A function               | `src/core/functions/<name>.function.ts`     |
| A refusal                | `src/core/errors/<name>.error.ts`           |
| A value class            | `src/core/values/<name>.value.ts`           |
| A type                   | `src/core/types/<name>.type.ts`             |
| A fake or testing helper | `src/testing/<group>/<name>.<kind>.ts`      |
| Wallet pass issuing      | `src/node/pass/<name>.<kind>.ts`            |
| Accounting: a contract   | `src/contracts/accounting/<name>.<kind>.ts` |
| Accounting: core         | `src/core/accounting/<name>.<kind>.ts`      |
| Accounting: testing kit  | `src/testing/accounting/<name>.<kind>.ts`   |
| Voice: a leaf contract   | `src/contracts/voice/<name>.<kind>.ts`      |
| Voice: anything else     | `src/core/voice/<name>.<kind>.ts`           |
| Voice: the SIP trunk     | `src/node/sip/<name>.<kind>.ts`             |
| A test                   | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/core/index.ts`, `src/contracts/index.ts`, `src/node/index.ts` and `src/testing/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add
  every new public file to the barrel and to its `__tests__/index.test.ts`.
- `managedClient`, the placeholder lookup, the JWT signer and the registries stay internal; `requestToken` (with
  `TokenRequest`) is public so a store host shares the one RFC 6749 client. `./testing`
  imports `.`, `./contracts` and `@stackra/container/testing` only (ADR 0269 decision 3). `./contracts` is the leaf: it
  imports `@stackra/contracts` and the `Money` and `Address` types only. `.` reads `valueOf` of `@stackra/market-packs`.
- Annotate every export whose inferred type would reach an unexported or deep-path type (`ExtensionBase`, `ActionBase`,
  `PassBase`, a provider's `bin/` class, `@types/react`'s `Element`): the declaration build fails with TS2883 (STA-1220).

## This package

- A secret is a name (`@Secret("RESEND_API_KEY")`), never a value. An Integration's `@Secret` fields stay unset on the
  instance: the managed client reads them blind from the `SecretStore` at call time. A connection's secret fields are
  non-enumerable, so they never spread, serialise or log.
- No credential, token or response body goes into an error, a rate-limit key or a log. A provider code enters a refusal
  only when it is a short machine code.
- No tenant vocabulary (R-59): a connection is owned by a user or by a scope node (`ScopeRef`, matched by its path), and
  the scope tree's levels are deployment data (ADR 0327).
- `Connection` does not declare `subscribe()` or `unsubscribe()`; a class adds them as its own methods and may say so
  with `implements ConnectionWebhooks`.
- No parameter properties and no `#private` fields; the source keeps to erasable syntax.
- Configuration, not code (ADR 0356): a provider is chosen through `ProviderResolver` from the tenant's Connection and
  the Market's data (`ProviderDefaults`); never branch on a Market, a country or a tenant in code.
- Managed or bring your own: a Connection's `source` says which (`ProviderSource`, `byo` by default); a managed one
  holds the platform key and a `resourceId` of a `ManagedProvisioning` resource. Which sources a category offers is the
  `provider-category` seed data; the provisioning steps are the `os.managed_provisioning` template pack, never code.
- A provider that takes form bodies sets `requestBody: "form"` on its Integration; never put POST parameters in the
  query string.
- One provider, one Integration (ADR 0355): a provider's roles are listed in `roles`; never add a second Integration or
  webhook route for the same provider.
- `ProviderResolver#candidates` is the one failover order (own, then managed, pack order); a caller never re-derives
  it. Provider lists are pack data under `providers.<capability>`, read by `MarketPackProviderDefaultsDriver`.
- No vendor Integration in this package (owner decision R3-8, STA-1281): vendors are connectors in the OS integrations
  service. This package keeps the bases, the managed client (OAuth client, token refresh), the stores and vault
  references, webhook signing, `ManagedProvisioning`, `ProviderDefaults` and `ProviderResolver`.
  `pin: ProviderMode.Managed` is how a platform-only check (Figentra's KYB and KYC of a tenant) keeps a tenant's own
  Connection out; never filter the list by hand for that.
- `IntegrationWebhooks` is data only: `scheme` stays a string (the codes are `@stackra/webhooks`'), `signature` is
  an HMAC body recipe and `recipe` (`WebhookSchemeRecipe`) the data of a non-HMAC scheme; `@stackra/webhooks`'
  `registerWebhookEvents` checks the fields each scheme needs. Never put a vendor's recipe values here.
- `ClientConnectionHostDriver` is abstract: the host's subclass declares the service's refs as `calls`
  (`ConnectionHostCalls`), and its constructor takes only class tokens; never hard-code a
  wire key or route of the integrations service here. `ConnectionHost#store` keeps `credentialsExpireAt` optional and
  last, so an older host still implements it.
- `ProviderPackSource` names `ResolvedPack`, so it lives in `src/core/ports`, not `./contracts`.
- A provider interface a Connection implements (`AccountingProvider`, `VoiceGateway`, the connectors) lives in
  `./contracts/types`; its drivers live with the package that owns the capability.
- Store accounts (D14): `StoreAccountConnector`, `StoreApp` and `MobileStore` live in `./contracts`; the App Store
  Connect and Google Play Integrations are OS connectors (os-50), never classes here. A store key reaches the CI runner
  through the connection's `CredentialRef`, never through the interface.
- `memory` ConnectionStore (STA-1308): `MemoryConnectionStoreDriver` delegates to a `LocalConnectionStoreDriver` it
  owns and shares its records in `LOCAL_CONNECTIONS`, so `useDrivers("memory")` resolves a port that has `local` and
  `hosted`. Keep it a pure delegate; behaviour changes go in the local store.

- Connectors by capability (ADR 0447): a connector kind (`ConnectorKind`) names one interface in `./contracts`; a new
  kind is a new member, never a sixth `IntegrationRole`. Resolve a kind's Connection through `ConnectorGateway` (or
  `connectionsOf` plus `ProviderResolver`), never by importing another package's connection class. A capability a
  channel may lack is an optional method on its interface, checked with `accepts`.
- A shelf (`IntegrationCategory`) is where the marketplace lists a provider; court, EDI, food-delivery, courier, ESL,
  scales, fraud and document-management connectors are Connection classes in OS integrations on those shelves, never
  a framework of their own here.
- A fraud score is a fact for the tenant's rules; nothing here holds, cancels or thresholds on it.
- EDI is canonical JSON through a network provider (R3-SO-07): no EDIFACT, X12 or AS2 codec in this package.
- Wallet passes (ADR 0348 decision 5): issuing lives in `./node` (`src/node/pass/`), so pkijs, asn1js and the zip
  writer never load with `.`. A driver takes its signer, `api` and options as constructor arguments the host passes;
  the `CmsSigner` port is in `./contracts`. Certificates and keys are read by secret name at each call and never put in
  an error; the Google Wallet Integration (JWT bearer auth) stays an OS connector, the driver only takes its `api`.
  Pass labels are lang keys the host resolves into `WalletPassRequest.labels`; never hard-code wording.
- Voice (ADR 0376 decision 7): `VoiceGateway` (calls) and `Speech` (streaming STT and TTS) are two interfaces a
  Connection implements; vendor Connections are OS connectors. The speech provider comes from the tenant's data region
  (`region-map:<region>.providers.speech` through `RegionMapSource`), never the market pack: `SpeechService` builds its
  own `ProviderResolver` over `RegionMapProviderDefaultsDriver`; never bind that driver as the container's
  `ProviderDefaults`. Dialects, the recording consent rule and its wording are pack keys read by `VoicePack`; a missing
  rule is `explicit`. Never hard-code a dialect, a notice, a provider or a price.
- Accounting (STA-794): a journal reaches a provider only through `postJournal` (or `postMappedJournal`, which maps it
  first); never call `AccountingProvider#post` directly. Account and tax mappings are data on the Connection
  (`AccountMapped`), never constants; `mapJournal` refuses an unmapped key and never passes it through. Accounting
  drivers are OS connectors; the recorded-case runner (`replayIntegrationApi`, `runAccountingCase`) stays here, names
  no vendor, and throws a `TypeError` that names the call and the differing part, never a body. A recording from public
  docs is `certification: "pending"`.
- Meters: `voice.minutes` and `speech.seconds` are written only through `VoiceMeter` (the existing `usage.recorded`
  event, `sum`, exact units); rounding and prices are rate-card data. Speech seconds are counted from raw bytes, so
  `AudioEncoding` stays uncompressed; adding a compressed codec needs another way to measure.
- SIP trunk (RV-51): `SipVoiceGateway` (`./node`) is protocol code, not a vendor: every carrier value is
  `SipTrunkOptions` data and credentials are secret names (`SIP_TRUNK_SECRETS`). It is a `Service`, not a Connection;
  the carrier's OS Connection delegates to it. Keep the SIP, SDP, RTP and digest codecs pure functions with
  recorded-fixture tests, drop datagrams from anything but the trunk, never log a number or audio, and say
  certification pending until it has run against the carrier. Recording stays refused until a recording store exists.
- A device's microphone and speaker are the `AudioDevice` port; its production drivers live with the device
  (platform, peripherals), `MemoryAudioDeviceDriver` here.

## PII

| Data                    | Where                                      | Handling                                                                                       |
| ----------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Connection credentials  | connection `@Secret` fields, store records | In memory (local) or encrypted by the store host (hosted); never enumerable, logged or echoed. |
| OAuth tokens            | `IntegrationRuntime`, `ConnectionHost`     | In memory per credential; in hosted mode refresh tokens never leave the store host.            |
| Provider answers        | managed client                             | Returned to the caller only; never stored or logged here.                                      |
| Fraud score requests    | `FraudScoreRequest`                        | Contact, IP, device and addresses travel for one score; never stored or logged here.           |
| Documents               | `DocumentFile`                             | Bytes held in memory for one call; never stored or logged here.                                |
| Wallet pass content     | `WalletPassRequest`, `IssuedWalletPass`    | Lock-screen data only (ADR 0348 d5); built and signed in memory, never stored or logged here.  |
| Call and lane audio     | `Speech`, `SpeechService`, `AudioDevice`   | Streamed through for one call or lane turn; never stored or logged here.                       |
| Transcripts             | `Transcript`                               | Returned to the caller only; never stored or logged here.                                      |
| Connected account label | `ConnectedAccount`, store records          | The provider's account id and name or domain, shown to the owner in the console.               |
