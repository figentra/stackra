# @stackra/integrations

<!--
Stackra file contract:
Purpose: the package's reader guide: Integrations, Connections and their stores, the provider resolver, the connector
         contracts (commerce, EDI, fraud scoring, document stores) and the gateway that resolves them, wallet pass
         issuing (`./node`), the voice channel (Speech port, meters, recording consent, handover, the SIP trunk
         driver in `./node`), accounting journals (account mapping per Connection, the recorded-case runner of
         accounting drivers), marketplaces, 3PLs and ad platforms (the ad-platform contract, hashed match keys, the
         recorded-case runners, the Meta home and the OS connector list with its doc links, STA-793), the EDI
         envelope and mailbox connector with its recorded-case runner, the webhook recipe types, and what is not here.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0308; ADR 0348; ADR 0355; ADR 0356; ADR 0376; ADR 0443; ADR 0447.
-->

Provider integrations (ADR 0308). An **Integration** describes a provider once, the same for every scope and user:
where its connections sit, how a call authenticates (six auth types), its base URL, rate limits, retries, health
schedule and webhook verification. A **Connection** is one stored credential set for it, supplied or granted by a scope
or a user. Both expose the same **managed client** (`api`), which authenticates, keeps to the rate limits, retries what
is safe and turns every provider outcome into a value or a typed refusal. This package absorbs the retired
`@stackra/connections`.

**Tier:** `tier:lib` (`packages/communication/integrations`). Entries `.`, `./contracts`, `./node` (wallet pass
issuing, the SIP trunk driver) and `./testing`.
Depends on `@stackra/actions` (the `RateLimitStore`, and `RequestContext` for the `request` connection context),
`@stackra/config` (`@Secret`, `SecretStore`), `@stackra/container`, `@stackra/contracts`, `@stackra/errors`, and the
`Money` and `Address` types of `@stackra/money` and `@stackra/validation`, `@stackra/events` (the `EventOutbox` the
voice meter writes to) and `@stackra/market-packs` (`valueOf`); `./node` adds `@stackra/data-transfer`
(`writeZip`), `pkijs` and `asn1js`, and Node's `dgram`, `dns` and `crypto` for SIP.

## What is here

| Symbol                                                                                                                  | Use                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `Integration`                                                                                                           | the kind base of a provider description; `api` uses the platform's own credentials                   |
| `Connection`                                                                                                            | the kind base of one credential set (`Connection<XIntegration>`), with `check()`                     |
| `ConnectedAccount`                                                                                                      | what `check()` returns: the provider account's id and label                                          |
| `AuthType`, `ConnectionLevel`, `IntegrationCategory`, `RateLimitScope`                                                  | the enums an Integration's options use                                                               |
| `ConnectionStore`                                                                                                       | the port: `find`, `byId`, `list`, `connect`, `disconnect`                                            |
| `LocalConnectionStoreDriver`, `HostedConnectionStoreDriver`                                                             | `local` (in process, development) and `hosted` (the integrations service holds them)                 |
| `MemoryConnectionStoreDriver`                                                                                           | `memory`: the local store under the name `useDrivers("memory")` picks (STA-1308)                     |
| `ConnectionHost`                                                                                                        | the port of the store host behind `hosted`                                                           |
| `ClientConnectionHostDriver`, `ConnectionHostCalls`                                                                     | the `ConnectionHost` over the integrations service's generated client (the host passes its refs)     |
| `requestToken`, `TokenRequest`                                                                                          | one OAuth token call (code exchange, refresh, client credentials) with the endpoint as data          |
| `RequestConnectionContextDriver`                                                                                        | the `request` `ConnectionContext`: the running call's scope and user                                 |
| `./contracts`: `ConnectionContext`                                                                                      | the port the store drivers read the call's owners from                                               |
| `IntegrationRuntime`                                                                                                    | builds every Integration and its managed clients; holds and renews OAuth tokens                      |
| `registerConnections`                                                                                                   | links each connection class to its Integration and key; gen emits the call                           |
| `resolvePlaceholders`                                                                                                   | fills `{field}` placeholders, for `@stackra/webhooks`' secret lookup                                 |
| types `IntegrationWebhooks`, `WebhookSignature`, `WebhookSchemeRecipe`                                                  | the `webhooks` option: an HMAC body recipe (`signature`) or a non-HMAC scheme's data (`recipe`)      |
| `ProviderRefusedError`, `ProviderUnavailableError`                                                                      | a provider's 4xx, and spent retries or a full bucket                                                 |
| `ConnectionCheckFailedError`, `ConnectionAmbiguousError`, `InvalidSignatureError`                                       | a failed `check()`, an ambiguous `find`, a webhook that does not verify                              |
| `./testing`: `fakeIntegrationApi`, `makeConnection`, `.withIntegrationApi`, `.withConnection`                           | fakes of the managed client and the store for tests                                                  |
| `IntegrationRole`, `ConnectorKind`                                                                                      | the five roles (ADR 0355) and the commerce connector kinds an Integration declares                   |
| `ProviderResolver`, `ProviderDrivers`, `NoProviderError`                                                                | the provider for a call: tenant Connection first, then the Market's platform default                 |
| `./contracts`: `ProviderDefaults`, `MarketContext`, `ProviderChoice`                                                    | the market-pack data and the Market the resolver reads                                               |
| `credentialRef`, `./contracts`: `CredentialRef`                                                                         | a stored reference to a Connection in the integrations vault, never the secret                       |
| `postJournal`, `assertBalanced`, `UnbalancedJournalError`, `./contracts`: `AccountingProvider`                          | balanced journals, posted once per idempotency key                                                   |
| `mapJournal`, `postMappedJournal`, `UnmappedAccountError`, `./contracts`: `AccountMap`, `AccountMapped`                 | our account and tax keys to the Connection's codes, then posted once (see Accounting)                |
| `./testing`: `MemoryAccountingConnector`, `replayIntegrationApi`, `runAccountingCase`, `AccountingCase`                 | the memory accounting driver, and the recorded-case runner every accounting driver passes            |
| `./contracts`: `SalesChannelConnector`, `ProductFeedConnector`, `FulfilmentProviderConnector`                           | what a commerce connector's Connection implements (carriers: `@stackra/shipping`)                    |
| `connectionsOf`                                                                                                         | the registered connection classes of a connector kind or category, by provider code (ADR 0447)       |
| `ConnectorGateway`, `ConnectorQuery`                                                                                    | the Connection of a connector kind (3PL, channel, feed, EDI, fraud, documents), by provider or pick  |
| `./contracts`: `ChannelMenu`, `ChannelModifierGroup`, `ChannelListing`, `ChannelReturn`, `ChannelPaymentMethod`         | the delivery-app and marketplace extensions of `SalesChannelConnector` and `ChannelOrder`            |
| `./contracts`: `EdiConnector`, `EdiDocument`, `EdiDocumentType`                                                         | canonical EDI documents through a managed or own EDI network (R3-SO-07)                              |
| `./contracts`: `FraudScoringConnector`, `FraudScore`, `FraudDecision`                                                   | a fraud score, shaped as the `fraud` facts a rule tests                                              |
| `./contracts`: `DocumentStoreConnector`, `StoredDocument`, `DocumentFile`                                               | iManage, NetDocuments, SharePoint: list, fetch and file documents                                    |
| `./testing`: `MemoryFulfilmentProvider`                                                                                 | the memory 3PL: one fulfilment per reference, `ship` plays the warehouse                             |
| `./contracts`: `AdPlatformConnector`, `ConversionEvent`, `MatchKeys`, `AdBatchResult`; `matchKeysOf`                    | server-side conversions and audience sync of an ad platform, people hashed first (see Marketplaces)  |
| `./testing`: `runConnectorCase`, `ConnectorCase`, `runFulfilmentCase`, `FulfilmentCase`, `MemoryAdPlatform`             | the recorded-case runners every connector driver passes, and the memory ad platform                  |
| `./contracts`: `PayrollConnector`, `PayInput`, `PayInputKind`; `assertPayInputs`; `./testing`: `MemoryPayrollConnector` | pay inputs (hours, sessions, tips, commission) pushed to the tenant's payroll provider               |
| `MarketPackProviderDefaultsDriver`, `ProviderPackSource`, `./contracts`: `ProviderMode`; `ProviderCandidate`            | the market-pack `ProviderDefaults` for every capability, and the failover list's own-or-managed mode |
| `./contracts`: `VoiceGateway`, `CallInstruction`, `CallStatus`, `RecordingConsent`; `recordingPlan`                     | the telephony port per Market; recording from the pack's consent rule                                |
| `./contracts`: `Speech`, `AudioDevice`; `SpeechService`, `VoicePack`, `VoiceMeter`                                      | streaming STT and TTS per data region, device audio, voice meters (see Voice channel)                |
| `./contracts`: `StoreAccountConnector`, `StoreApp`, `MobileStore`                                                       | a merchant's own App Store Connect key or Google Play service account (D14)                          |
| `Pass`, `PassContent`                                                                                                   | the wallet pass kind a module declares (ADR 0348 decision 5)                                         |

## An integration and its connection

```ts
export class ResendIntegration extends Integration({
  provider: "resend",
  category: IntegrationCategory.Email,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {apiKey}" },
  baseUrl: "https://api.resend.com",
  rateLimits: [{ requests: 10, per: "1s", by: RateLimitScope.Credential }],
  retry: { idempotencyHeader: "Idempotency-Key" },
  health: { every: "6h", failAfter: 3 },
  webhooks: {
    scheme: SignatureScheme.StandardWebhooks,
    secret: "{webhookSecret}",
    eventType: { path: "type" },
  },
}) {
  @Secret("RESEND_API_KEY") // a platform secret: Infisical, synced by runway
  apiKey!: string;
}

export class ResendConnection extends Connection<ResendIntegration> {
  @Secret("RESEND_TENANT_API_KEY") // a scope's secret: kept in the connection store, encrypted
  apiKey!: string;

  fromAddress!: Email;

  async check(): Promise<ConnectedAccount> {
    const domains = await this.api.get<ResendDomainList>("/domains");
    // ...
    return ConnectedAccount.create({ id: domain, label: domain });
  }
}
```

A `{field}` placeholder resolves on the connection first, then on the Integration, so a scope's own key wins over the
platform's with no second mechanism. A secret is always a name; its value is read blind at call time.

```ts
const own = await this.connections.find(ResendConnection); // the call's scope node, or the nearest one above it
const api = own?.api ?? this.resend.api;
await api.post<ResendSendResult>("/emails", mail, { idempotencyKey });
```

`.` also exports the type `PassBase`, the instance side of `Pass({ key })`, so a consumer's
`class LoyaltyCardPass extends Pass({ key: "loyalty_card" })` has a nameable base in its declaration emit (TS2883,
STA-1220).

## Wallet passes (`./node`, ADR 0348 decision 5)

A module's `Pass({ key })` kind builds `PassContent`; a `WalletPassIssuer` driver issues it:

| Symbol                                                                        | Use                                                                                                      |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `./contracts`: `CmsSigner`                                                    | the host port that makes a detached CMS (PKCS #7) signature; the key stays with the host                 |
| `PkijsCmsSignerDriver`, `CmsSignerSecrets`, `APPLE_WALLET_SIGNER_SECRETS`     | the `CmsSigner` over pkijs, reading PEM certificate, key and chain by secret name                        |
| `WalletPassIssuer`, `WalletPassRequest`, `IssuedWalletPass`                   | issue one pass: the kind, its content, the shown text of its lang keys, locale, time                     |
| `AppleWalletPassDriver`, `AppleWalletOptions`, `applePassJson`, `buildPkpass` | the signed `.pkpass` (pass.json, brand-kit images, SHA-1 manifest, signature, zip)                       |
| `GoogleWalletPassDriver`, `GoogleWalletOptions`, `googleWalletObject`         | the `genericObject` written through the Google Wallet Integration's `api` (JWT bearer) and the save link |

```ts
// The issuers are abstract: the host's subclass declares its deployment data; constructors take class tokens only.
class ShopAppleWalletPassDriver extends AppleWalletPassDriver {
  protected override readonly options = { passTypeIdentifier, teamIdentifier, organizationName };
}
class ShopGoogleWalletPassDriver extends GoogleWalletPassDriver {
  protected override readonly api = googleWallet.api;
  protected override readonly options = { issuerId, serviceAccountEmail };
}
const signer = new PkijsCmsSignerDriver(secrets); // APPLE_WALLET_PASS_CERTIFICATE, _KEY, APPLE_WALLET_WWDR_CERTIFICATE
const apple = new ShopAppleWalletPassDriver(signer);
const google = new ShopGoogleWalletPassDriver(secrets);
const request = {
  kind: "loyalty_card",
  content: await pass.content(card),
  labels,
  locale,
  issuedAt,
  images,
};
const { file } = await apple.issue(request); // application/vnd.apple.pkpass
const { saveUrl } = await google.issue(request); // https://pay.google.com/gp/v/save/<jwt>
```

A pass kind's labels are lang keys; the host passes their text in `labels`. Identifiers, styles and classes are the
deployment's data; the certificates and keys are secrets read by name (`GOOGLE_WALLET_ISSUER_KEY`), never values.
Neither driver is certified yet against a registered pass type or a live issuer account.

## Voice channel (`src/*/voice/`, ADR 0376 decision 7)

Telephony is two ports: `VoiceGateway` places and steers calls (Twilio, the Saudi carrier's SIP driver of stackra-43),
`Speech` streams recognition and synthesis over raw audio. A call's audio, a drive-through lane's microphone and a
till speaker all reach the same `Speech`.

| Symbol                                                                                 | Use                                                                                                                 |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `./contracts`: `Speech`, `SpeechRequest`, `Transcript`, `AudioFormat`, `AudioEncoding` | the speech provider interface a Connection implements: `listen` (streaming STT), `speak` (streaming TTS)            |
| `SpeechService`, `SpeechSession`                                                       | picks the region's speech Connection, streams through it, meters `speech.seconds`; `listenOn`/`sayOn` over a device |
| `./contracts`: `RegionMapSource`; `RegionMapProviderDefaultsDriver`                    | the provider list of `region-map:<region>.providers.speech`, bound by the OS tenancy and markets service            |
| `./contracts`: `AudioDevice`; `MemoryAudioDeviceDriver`                                | a local microphone and speaker (lane, till, kiosk); the memory one for development and tests                        |
| `VoicePack`                                                                            | the pack's dialects (`speech.dialects`), the voice, the consent rule and its notice and question text               |
| `consentSteps`, `handoverSteps`                                                        | the call steps of a recording plan, and of a handover to a human with its fallback                                  |
| `VoiceMeter`, `VOICE_METERS`, `VoiceUsage`, `audioSeconds`                             | `usage.recorded` on `voice.minutes` per finished call and `speech.seconds` per stream, through the outbox           |

```ts
const speech = await voicePack.voice(market, tenantVoice); // the pack's dialect when the tenant's is not offered
const plan = await voicePack.plan(market, settings.recordCalls);
const steps = [
  ...consentSteps(plan, await voicePack.consentText(market, speech.language), speech, {
    actionUrl,
    timeoutSeconds: 5,
  }),
  { kind: "listen", speech, actionUrl, timeoutSeconds: 5 },
];
// Later, the AI receptionist cannot help:
await voice.redirect(
  ref,
  handoverSteps({ to: settings.handoverNumber, timeoutSeconds: 20, announce, speech }),
);
// The call ended (status webhook):
await voiceMeter.call(await voice.lookup(ref), { reference: ref, scopeId });

// A drive-through lane:
const session = { drivers: SPEECH_CONNECTIONS, usage: { reference: laneSessionId, scopeId } };
for await (const heard of speechService.listenOn(lane, { speech, format, signal }, session))
  if (heard.final) await order(heard.text);
await speechService.sayOn(lane, reply, { speech, format }, session);
```

- Configuration, not code: dialects, the consent rule and its wording are market-pack data; the provider is region-map
  data; the human's number, ring time and whether to record are tenant settings; prices and rounding of the two meters
  are the `rate-card:voice-minutes` data. A pack without a consent rule is treated as `explicit`.
- `zeroRetention: true` (the caller's choice for health and privileged speech) serves only a provider whose
  `retainsAudio` is false; the region map already keeps the audio in region.
- Not built here: vendor speech Connections (OS integrations, R3-8), a platform microphone or peripherals-bridge
  `AudioDevice` driver (device side), understanding the caller's spoken yes or no (the conversation's).

### SIP trunk (`./node`, `src/node/sip/`, RV-51)

A licensed carrier that gives only a SIP trunk gets `SipVoiceGateway`, a `VoiceGateway` that runs the call itself:
it places calls (INVITE, digest auth MD5 or SHA-256, ring timeout by CANCEL), takes incoming ones from the trunk,
registers when the trunk asks, and plays each `CallInstruction`: `say` and `listen` through `SpeechService` over the
call's RTP leg (`RtpAudioDeviceDriver`, G.711 A-law or mu-law, 20 ms packets), `play` from a WAV already in the
call's codec, `handover` by REFER, `hang_up` by BYE. Instructions come from the host's own call webhooks in the shape
`answer` writes (`{"instructions": [...]}`); statuses are posted in the parameters `event` reads (`CallRef`,
`Direction`, `From`, `To`, `Status`, `SpeechResult`, `Confidence`); an answered call's minutes go to `VoiceMeter` when
it ends. The carrier's platform Connection (OS connector) delegates to it.

```ts
// Abstract: the host's subclass declares the trunk and the call host; the constructor takes the SecretStore only.
class ShopSipVoiceGateway extends SipVoiceGateway {
  protected override readonly options = {
    host,
    publicAddress,
    codecs: ["alaw", "mulaw"],
    keepPlus: true,
    ringSeconds: 30,
    inbound,
  };
  protected override readonly host = {
    speech: speechService,
    meter: voiceMeter,
    session: (reference) => sessionOf(reference),
    post,
  };
}
const sip = new ShopSipVoiceGateway(secrets); // SIP_TRUNK_USERNAME and SIP_TRUNK_PASSWORD, read by name
await sip.start(); // binds 5060, registers when `register` is set
const placed = await sip.call(outbound);
```

- Configuration, not code: host, domain, public address, ports, registration, codec order, number format and ring
  time are `SipTrunkOptions`, deployment data of the carrier's Connection; no carrier is named in code.
- Only datagrams from the trunk's resolved addresses are heard. Numbers, audio and transcripts are never logged.
- Certification pending (owner D3, 2026-10-27): built from RFC 3261, 3264, 3515, 3550, 4566 and 7616 with
  recorded-fixture tests, not yet run against the carrier.
- Not served: recording (`record` and `OutboundCall.record` are refused, 501 `recording_unsupported`), TLS, TCP,
  SRTP, DTMF, session timers, RTCP, a jitter buffer, symmetric-RTP latching, a fixed RTP port range, a caller id on
  handover, transcoding (`play` takes only a WAV in the call's codec). Calls live in one process and do not survive a
  restart; `lookup` answers for the last 1000 ended calls.

## The six auth types

`OAuth2Code` (the connection holds the tokens; refreshed single-flight before they expire, revoked at disconnect),
`OAuth2ClientCredentials` (a token cached per credential), `ApiKey` (a header or a query parameter), `Basic`, `Jwt`
(HS256, RS256 or ES256, signed per call) and `None`. A provider outside the six is a driver that signs its own requests.

An OAuth token goes in `authorization: Bearer <token>` unless `auth.token` says otherwise:
`token: { header: "x-amz-access-token", format: "{accessToken}" }` (Amazon SP-API), `{ header: "access-token", format:
"{accessToken}" }` (TikTok). Headers every call needs besides the credentials are the Integration's `headers`, each
with its placeholders (`headers: { "developer-token": "{developerToken}" }`, Google Ads); a call's own headers win over
them, and the credentials win over both.

## Levels

`ConnectionLevel.User` is the user the call acts for; `ConnectionLevel.Scope` is the call's scope node, then each node
above it on its path. The scope tree's own levels (platform, product, tenant) are deployment data (ADR 0327), so this
package names none of them.

## The call's owners

`ConnectionContext` (`@stackra/integrations/contracts`) answers the running call's scope node and the user it acts for.
`RequestConnectionContextDriver` reads both from `@stackra/actions`' `RequestContext`: `scope()` is the call's scope,
`user()` is `actor.onBehalfOf ?? actor` when that is a user. Outside a call, or for a service, agent, job or system
subject, the answer is `undefined`. It never reads request input.

```ts
const context = new RequestConnectionContextDriver(request);
const store = new LocalConnectionStoreDriver(context, runtime);
```

## Choosing a provider per tenant and Market (ADR 0356)

```ts
const voice = await resolver.resolve<VoiceGateway>("voice", VOICE_CONNECTIONS);
```

`ProviderResolver` reads the Market from `MarketContext` and its providers, in order, from `ProviderDefaults`
(market-pack data). The tenant's own Connection of an offered provider wins; otherwise the Market's platform Connection
serves; nothing fitting is `NoProviderError`. A follow-up call reloads the same Connection with `byConnection` or
`byRef`. No Market, provider or default is written in code, and `@Replaces` is never used for this.

`candidates` answers the whole failover list instead of the first entry: the tenant's own Connections (mode `own`),
then the Market's platform Connections (mode `managed`), each in the pack's order. The caller tries the next on a
retryable failure, records the mode, and applies its own policy (an own Connection serving alone, say). Both methods
take the Market as an argument (`resolve(capability, drivers, accepts, market)`, `candidates(capability, drivers, {
market })`) and fall back to `MarketContext` without one (ADR 0422).

```ts
for (const { connection, mode } of await resolver.candidates<SmsTransport>("sms", SMS_CONNECTIONS, { market })) { … }
```

`pin` keeps one mode only. Verification (KYC and KYB, capability `verification`, pack key `providers.verification`) uses
it: Figentra's own checks of a tenant pin to the platform Connections, so a tenant's own account never answers them;
a tenant's checks of its own customers leave it out and take the tenant's own Connection first (ADR 0376 decision 1
Note; capability map M2). `@stackra/identity`'s `VerificationService#verifyThrough` runs the list.

```ts
const platform = await resolver.candidates<VerificationProvider>("verification", drivers, {
  pin: ProviderMode.Managed,
});
```

`MarketPackProviderDefaultsDriver` is the `market-pack` `ProviderDefaults`: it reads the pack's `providers.<capability>`
list in force today (`providers.sms: [unifonic, { provider: taqnyat, status: planned }]`), live entries only, and asks
the host's `ProviderPackSource` for each provider's platform Connection; a provider with none is offered to tenants
that bring their own.

## Connectors by capability (ADR 0447)

A module that needs a Connection it does not define (an accounting export, an EDI network, a 3PL) looks it up by
capability. `connectionsOf(kind)` reads the registry gen fills and answers a `ProviderDrivers` map;
`ConnectorGateway` passes it to `ProviderResolver`, so the ADR 0356 rule still picks the Connection.

```ts
const threePl = await gateway.fulfilment(); // the tenant's own 3PL, else the Market's managed one
await threePl.create(request);

const app = await gateway.channel({
  provider: order.channel, // the channel the order came from
  accepts: (channel) => channel.setPrepTime !== undefined,
});
await app.setPrepTime?.(order.externalId, 20);
```

The Market's providers per kind are pack data under `providers.<kind>` (`providers.fulfilment_provider`,
`providers.edi`, `providers.fraud_scoring`). The optional `SalesChannelConnector` methods (menu, modifiers,
availability, prep time, reject, cancel, returns, listings) exist only on channels that support them; filter with
`accepts`. A `FraudScore` is a fact value as it stands (`fraud.score`, `fraud.decision`, `fraud.reasons`); the consuming
module registers the `fraud` fact source and the tenant's rules hold or cancel.

The shelves `food_delivery`, `courier`, `edi`, `fraud`, `document_management`, `esl`, `scales` and `court` list the
OS connectors built on these contracts; a court-system connector is a Connection class on the `court` shelf, never a
framework of its own.

## Accounting (STA-794)

A source record (an invoice, a trust transfer, Commerce's published journals, STA-774) writes its journal in our
account keys (`receivables`, `sales`, `vat_output`) and tax keys. The tenant's accounting Connection implements
`AccountingProvider` (`post`, `find`, `accounts`) and `AccountMapped` (`accountMap()`): the mapping of those keys to the
codes of the tenant's chart in the provider is data on that Connection, edited on the mapping screen (which reads
`accounts()`) and seeded per industry template, never code. `postMappedJournal(connection, entry, idempotencyKey)` maps
the journal (`mapJournal` refuses an unmapped key with `UnmappedAccountError`, never passing a key through as a code),
then `postJournal` checks the balance and posts at most once per key, finding the journal a lost answer already posted.

The provider drivers are OS integrations connectors (ADR 0443 decision 7): Xero, QuickBooks Online, Zoho Books, Qoyod
and Daftra for R1 (OS ADR 0038 d5; Odoo later). Each ships `AccountingCase` recordings beside it and passes
`runAccountingCase(make, case)` from `./testing`, which builds the driver over `replayIntegrationApi` (the recorded
calls in order, each pinned by method, path, query, body and idempotency key), posts twice (the second must find the
first and post nothing), reads the chart and checks every recorded call was made. A recording built from the
provider's public API documentation says `certification: "pending"` (owner D3, 2026-10-27); a sandbox capture replaces
it with `"sandbox"`. `MemoryAccountingConnector` is the memory driver for tests and local hosts.

## Marketplaces, 3PLs and ad platforms (STA-793)

Stackra ships the contracts and the shared machinery; every vendor Connection is an OS integrations connector (ADR 0443
decision 7), built from the vendor's public API documentation and marked certification pending (owner D4, 2026-10-27).

- A marketplace or shop implements `SalesChannelConnector` (`ConnectorKind.SalesChannel`, and `ProductFeed` for its
  listings where it has them); a 3PL or WMS implements `FulfilmentProviderConnector`; a shopping or ad catalogue
  implements `ProductFeedConnector`; an ad platform implements `AdPlatformConnector` (`ConnectorKind.AdPlatform`,
  `gateway.ads()`): `sendConversions(events)` for its conversions API and `syncAudience(audience, members, mode)` for its
  customer audiences.
- A person reaches an ad platform only as `MatchKeys`: `matchKeysOf(person, { phone })` trims and lowercases the email
  and SHA-256 hashes it, the phone and our id. The phone format is the Connection's setting: `e164` (Google Ads, TikTok)
  or `digits` (Meta, Snap). Our event names map to the platform's on the Connection; a conversion's `eventId` is the
  pixel's, so the platform counts it once. Consent is checked before a `ConversionEvent` is built.
- Webhooks need no new machinery: Salla's `x-salla-signature` and Meta's `x-hub-signature-256` are `hmac` recipes
  (`WebhookSignature`), Amazon notifies through SQS or EventBridge (no webhook), and any other scheme is a
  `WebhookSchemeRecipe`. The recipes are OS integrations data.
- Each connector ships recorded cases beside its driver and passes them: `runFulfilmentCase(make, case)` for a 3PL
  (the hand-over is made twice and must return one fulfilment), `runConnectorCase(make, case)` for every other contract
  (each step's method, arguments and result or refusal, over `replayIntegrationApi`). `certification: "pending"` until a
  sandbox capture replaces the recording.
- Meta has one Integration, in OS integrations: its Connection serves WhatsApp (the `@stackra/notifications`
  `ConnectionWhatsAppTransportDriver` and `MetaWhatsAppInboundDriver` read it), the catalogue (`ProductFeed`), the
  conversions API and audiences (`AdPlatform`) and the pixel. There is no second Meta Integration anywhere.

The OS connectors (os-104), with the public documentation each is built from:

| Connector                                                                  | Contracts                                               | Auth                                                                                                         | Public docs                                                                                         |
| -------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Amazon (SP-API)                                                            | `SalesChannelConnector`, `ProductFeedConnector`         | `OAuth2Code` (Login with Amazon), `token: { header: "x-amz-access-token" }`, regional `baseUrl`              | https://developer-docs.amazon.com/sp-api/                                                           |
| noon                                                                       | `SalesChannelConnector`                                 | per noon's partner API                                                                                       | https://partners.noon.com (seller-gated docs; scope to confirm)                                     |
| Salla                                                                      | `SalesChannelConnector`                                 | `OAuth2Code`, `hmac` webhook recipe                                                                          | https://docs.salla.dev/                                                                             |
| Zid                                                                        | `SalesChannelConnector`                                 | `OAuth2Code`, `token: { header: "x-manager-token" }`, `headers: { authorization: "Bearer {authorization}" }` | https://docs.zid.sa/                                                                                |
| Meta (one Integration)                                                     | `AdPlatformConnector`, `ProductFeedConnector`, WhatsApp | `OAuth2Code` (system user token), `hmac` webhook recipe                                                      | https://developers.facebook.com/docs/marketing-api/conversions-api                                  |
| TikTok                                                                     | `AdPlatformConnector`, `ProductFeedConnector`           | `OAuth2Code`, `token: { header: "access-token" }`                                                            | https://business-api.tiktok.com/portal/docs                                                         |
| Snap                                                                       | `AdPlatformConnector`, `ProductFeedConnector`           | `OAuth2Code`                                                                                                 | https://developers.snap.com/api/marketing-api/Conversions-API                                       |
| Google Ads, Merchant Center                                                | `AdPlatformConnector`, `ProductFeedConnector`           | `OAuth2Code`, `headers: { "developer-token": "{developerToken}" }`                                           | https://developers.google.com/google-ads/api/docs/start, https://developers.google.com/merchant/api |
| One 3PL per launch country (COM-113, on the first design partner's demand) | `FulfilmentProviderConnector`                           | per provider                                                                                                 | the chosen provider's API docs                                                                      |

## EDI (stackra-46, `src/*/edi/`)

The `edi` connector kind is `EdiConnector` (`send` once per key, `receive` a page, `acknowledge`). Stackra keeps the
machinery that names no vendor (ADR 0443 decision 8):

- **The envelope.** `readInterchange(text)` reads an ASC X12 (ISA, GS, ST) or UN/EDIFACT (UNA, UNB, UNH) interchange
  into an `EdiInterchange` (parties, control number, date, test flag, version, messages with their body segments),
  checking every trailer count and control number; `writeInterchange` writes one back (X12 `*`, `>`, `~`; EDIFACT the
  UNA defaults with `?` escapes). A broken interchange is `MalformedEdiError` (`malformed_edi`).
- **Acknowledgements.** `functionalAcknowledgement(received, control, at)` builds the X12 997 (AK1, AK2 and AK5 `A`,
  AK9 per group) or the EDIFACT CONTRL (UCI action 7) back to the sender; an interchange of acknowledgements gets none.
- **The generic driver.** `MailboxEdiConnector(mailbox, options)` implements `EdiConnector` over the `EdiMailbox`
  port (`./contracts`: put once per name, list, get, remove, control numbers per partner). `send` envelopes
  `body.segments` for the partner (`<qualifier>:<id>`); `receive` turns each message into a canonical `EdiDocument`
  (type from `EDI_MESSAGE_CODES`: 850/ORDERS, 855/ORDRSP, 856/DESADV, 810/INVOIC, 997/CONTRL; reference from BEG, BAK,
  BSN, BIG or BGM); `acknowledge` sends the 997 or CONTRL and removes the interchange. `MailboxEdiOptions` (syntax, our
  party, version, test) is Connection data. `MemoryEdiMailbox` is the memory transport.
- **Recorded cases.** An OS EDI connector ships `EdiCase` recordings and passes `runEdiCase(make, case)` from
  `./testing`: each document sent twice under its key (same id), every page received, each acknowledged, every recorded
  call made.

Certification pending (owner D3, 2026-10-27): built from the public X12 004010 and EDIFACT D.96A envelope rules, run by
no partner or network yet. The transports (AS2 with MDNs, SFTP, a VAN mailbox) and the managed network connectors
(Stedi, SPS Commerce, Orderful, ecosio) are OS integrations connectors on the `edi` shelf; mapping canonical documents
to segments is the consuming module's (Commerce STA-778).

## Payroll

The `payroll` category's Connections implement `PayrollConnector.pushPayInputs(batch, idempotencyKey)`: one pay
period's hours, sessions, tips and commission per employee, each with the provider's employee id and pay code from the
tenant's mapping. `assertPayInputs` checks a batch before any call; a repeated key pushes nothing. Payroll itself stays
with the provider (RV-50). The provider connectors (ZenHR, Kombo, Gusto) live with the capability's owner;
`MemoryPayrollConnector` in `./testing` serves tests and local hosts.

## Store accounts (D14)

A white-label app is published under the merchant's own store account when one is connected, under Figentra's
otherwise. The `app_stores` category's Connections implement `StoreAccountConnector`: `store` (`MobileStore`) and
`findApp(appId)`, which the console uses to check a connection before a release. The App Store Connect and Google Play
connectors live in the OS integrations service (os-50) and use the existing auth: `AuthType.Jwt` with ES256 for App
Store Connect (`kid` the key id, `iss` the issuer id, `aud` `appstoreconnect-v1`, at most `20m`), and
`AuthType.OAuth2JwtBearer` with the `androidpublisher` scope for Google Play. The CI runner reads the key through the
connection's `CredentialRef`; the key never passes through the interface. The `provider-category:app-stores` seed is
bring-your-own only: Figentra's account needs no Connection.

## Vendor connectors live in OS integrations (STA-1281)

This package keeps the ports and the shared machinery: the Integration and Connection bases, the managed client (OAuth
client, token requests and refresh, API key and JWT auth), the connection stores and the vault references, webhook
signing, `ManagedProvisioning`, `ProviderDefaults` and `ProviderResolver`. Every vendor Integration is a connector in
the OS integrations service (owner decision R3-8). The Chatwoot Integration and Connection left this package for it
(os-104): copy `packages/communication/integrations/src/core/providers/chatwoot/` at commit `8d3f7b2`
(`figentra/sta-666-wave12` before the move); it imports only this package's public names.

## A per-region base URL

`baseUrl: "https://{host}"` (Chatwoot's `{chatwootHost}`) fills the host from the credential set (connection first, then the Integration's
`@Secret`), so each region's deployment talks to its own instance. It must start with `https://`.

## Form bodies

`api.post(path, body, { form: true })` sends `application/x-www-form-urlencoded` (Twilio, Unifonic); the body is a flat
record and an array repeats its key.

## Not here

- The webhook kind and its verification: `WebhookEvent` is `@stackra/events`'; verifying and routing is
  `@stackra/webhooks`, which reads `IntegrationWebhooks`. A scheme that is not an HMAC over the raw body (a body token,
  an AES-GCM body, an ordered-field HMAC, a keyed field digest, a shared header, a JWT HS256) declares its data under
  `webhooks.recipe` (`WebhookSchemeRecipe`); the vendor recipes themselves are OS integrations data (ADR 0443 d7).
- The OAuth consent flow (authorize URL, PKCE, code exchange) and the console's connect pages: the integrations service.
- Lifecycle events (`integrations.connection.*.v1`), tombstones and encryption at rest: the store host.
- Provider drivers of other packages' ports: SMS, WhatsApp, push, mail and voice drivers are `@stackra/notifications`';
  payment gateways `@stackra/payments`'; carriers OS integrations connectors behind `@stackra/shipping`.
- EDI transports and networks (AS2, SFTP, VAN mailboxes; Stedi, SPS Commerce, Orderful, ecosio) and the mapping of
  purchase orders, receipts and invoices to segments: OS integrations connectors and Commerce, certification pending.
- Accounting provider drivers (Xero, QuickBooks Online, Zoho Books, Qoyod, Daftra, later Odoo) and their recordings:
  OS integrations connectors (ADR 0443 decision 7), certification pending.
- Marketplace, 3PL and ad-platform Integrations: OS integrations connectors (see Marketplaces, 3PLs and ad
  platforms), certification pending. The Google Wallet Integration itself (base URL, `OAuth2JwtBearer` auth) is an OS connector (R3-8); `./node` takes its `api`.
- Wallet pass device updates (the Apple pass web service and push, Google object patches on record change) and
  revocation: not built yet (STA-791).

## The hosted store over the generated client

The host binds `ConnectionHost` to a subclass of the abstract `ClientConnectionHostDriver` that declares the
integrations service's refs from `#stackra/clients/<service>` as `calls`, so this package names no wire key. The
constructor takes only the injected `ClientTransport` (ADR 0294 rule 17: classes are the only tokens):

```ts
export class OsConnectionHostDriver extends ClientConnectionHostDriver {
  protected override readonly calls = {
    resolve: ResolveConnectionsQuery,
    load: LoadConnectionQuery,
    store: StoreConnectionAction,
    disconnect: DisconnectConnectionAction,
    token: IssueAccessTokenAction,
  };
}
```

`ConnectInput.credentialsExpireAt` (an API key's or a certificate's end) reaches the host as the last argument of
`ConnectionHost#store`, for its expiry alerts. The store host runs its code exchange and refresh with `requestToken`:

```ts
const tokens = await requestToken({
  url: connector.tokenUrl,
  form: {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUrl,
    code_verifier: verifier,
  },
  clientId,
  clientSecret,
  provider: connector.provider,
  now: ctx.now(),
});
```
