# @stackra/integrations

<!--
Stackra file contract:
Purpose: the package's reader guide: Integrations, Connections and their stores, the provider resolver, the connector
         contracts (commerce, EDI, fraud scoring, document stores) and the gateway that resolves them, wallet pass
         issuing (`./node`), and what is not here.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0308; ADR 0348; ADR 0355; ADR 0356; ADR 0376; ADR 0447.
-->

Provider integrations (ADR 0308). An **Integration** describes a provider once, the same for every scope and user:
where its connections sit, how a call authenticates (six auth types), its base URL, rate limits, retries, health
schedule and webhook verification. A **Connection** is one stored credential set for it, supplied or granted by a scope
or a user. Both expose the same **managed client** (`api`), which authenticates, keeps to the rate limits, retries what
is safe and turns every provider outcome into a value or a typed refusal. This package absorbs the retired
`@stackra/connections`.

**Tier:** `tier:lib` (`packages/communication/integrations`). Entries `.`, `./contracts`, `./node` (wallet pass
issuing) and `./testing`.
Depends on `@stackra/actions` (the `RateLimitStore`, and `RequestContext` for the `request` connection context),
`@stackra/config` (`@Secret`, `SecretStore`), `@stackra/container`, `@stackra/contracts`, `@stackra/errors`, and the
`Money` and `Address` types of `@stackra/money` and `@stackra/validation`; `./node` adds `@stackra/data-transfer`
(`writeZip`), `pkijs` and `asn1js`.

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
| `ProviderRefusedError`, `ProviderUnavailableError`                                                                      | a provider's 4xx, and spent retries or a full bucket                                                 |
| `ConnectionCheckFailedError`, `ConnectionAmbiguousError`, `InvalidSignatureError`                                       | a failed `check()`, an ambiguous `find`, a webhook that does not verify                              |
| `./testing`: `fakeIntegrationApi`, `makeConnection`, `.withIntegrationApi`, `.withConnection`                           | fakes of the managed client and the store for tests                                                  |
| `IntegrationRole`, `ConnectorKind`                                                                                      | the five roles (ADR 0355) and the commerce connector kinds an Integration declares                   |
| `ProviderResolver`, `ProviderDrivers`, `NoProviderError`                                                                | the provider for a call: tenant Connection first, then the Market's platform default                 |
| `./contracts`: `ProviderDefaults`, `MarketContext`, `ProviderChoice`                                                    | the market-pack data and the Market the resolver reads                                               |
| `credentialRef`, `./contracts`: `CredentialRef`                                                                         | a stored reference to a Connection in the integrations vault, never the secret                       |
| `postJournal`, `assertBalanced`, `UnbalancedJournalError`, `./contracts`: `AccountingProvider`                          | balanced journals, posted once per idempotency key                                                   |
| `./contracts`: `SalesChannelConnector`, `ProductFeedConnector`, `FulfilmentProviderConnector`                           | what a commerce connector's Connection implements (carriers: `@stackra/shipping`)                    |
| `connectionsOf`                                                                                                         | the registered connection classes of a connector kind or category, by provider code (ADR 0447)       |
| `ConnectorGateway`, `ConnectorQuery`                                                                                    | the Connection of a connector kind (3PL, channel, feed, EDI, fraud, documents), by provider or pick  |
| `./contracts`: `ChannelMenu`, `ChannelModifierGroup`, `ChannelListing`, `ChannelReturn`, `ChannelPaymentMethod`         | the delivery-app and marketplace extensions of `SalesChannelConnector` and `ChannelOrder`            |
| `./contracts`: `EdiConnector`, `EdiDocument`, `EdiDocumentType`                                                         | canonical EDI documents through a managed or own EDI network (R3-SO-07)                              |
| `./contracts`: `FraudScoringConnector`, `FraudScore`, `FraudDecision`                                                   | a fraud score, shaped as the `fraud` facts a rule tests                                              |
| `./contracts`: `DocumentStoreConnector`, `StoredDocument`, `DocumentFile`                                               | iManage, NetDocuments, SharePoint: list, fetch and file documents                                    |
| `./testing`: `MemoryFulfilmentProvider`                                                                                 | the memory 3PL: one fulfilment per reference, `ship` plays the warehouse                             |
| `./contracts`: `PayrollConnector`, `PayInput`, `PayInputKind`; `assertPayInputs`; `./testing`: `MemoryPayrollConnector` | pay inputs (hours, sessions, tips, commission) pushed to the tenant's payroll provider               |
| `MarketPackProviderDefaultsDriver`, `ProviderPackSource`, `./contracts`: `ProviderMode`; `ProviderCandidate`            | the market-pack `ProviderDefaults` for every capability, and the failover list's own-or-managed mode |
| `./contracts`: `VoiceGateway`, `CallInstruction`, `CallStatus`, `RecordingConsent`; `recordingPlan`                     | the telephony port per Market; recording from the pack's consent rule                                |
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
const signer = new PkijsCmsSignerDriver(secrets); // APPLE_WALLET_PASS_CERTIFICATE, _KEY, APPLE_WALLET_WWDR_CERTIFICATE
const apple = new AppleWalletPassDriver(signer, {
  passTypeIdentifier,
  teamIdentifier,
  organizationName,
});
const google = new GoogleWalletPassDriver(googleWallet.api, secrets, {
  issuerId,
  serviceAccountEmail,
});
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

## The six auth types

`OAuth2Code` (the connection holds the tokens; refreshed single-flight before they expire, revoked at disconnect),
`OAuth2ClientCredentials` (a token cached per credential), `ApiKey` (a header or a query parameter), `Basic`, `Jwt`
(HS256, RS256 or ES256, signed per call) and `None`. A provider outside the six is a driver that signs its own requests.

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
  `@stackra/webhooks`, which reads `IntegrationWebhooks`.
- The OAuth consent flow (authorize URL, PKCE, code exchange) and the console's connect pages: the integrations service.
- Lifecycle events (`integrations.connection.*.v1`), tombstones and encryption at rest: the store host.
- Provider drivers of other packages' ports: SMS, WhatsApp, push, mail and voice drivers are `@stackra/notifications`';
  payment gateways `@stackra/payments`'; carriers OS integrations connectors behind `@stackra/shipping`.
- Ad-platform and marketplace Integrations: not built yet (see the spec's open items). The Google Wallet
  Integration itself (base URL, `OAuth2JwtBearer` auth) is an OS connector (R3-8); `./node` takes its `api`.
- Wallet pass device updates (the Apple pass web service and push, Google object patches on record change) and
  revocation: not built yet (STA-791).

## The hosted store over the generated client

The host binds `ConnectionHost` to a subclass of `ClientConnectionHostDriver` that passes the integrations service's
refs from `#stackra/clients/<service>`, so this package names no wire key:

```ts
export class OsConnectionHostDriver extends ClientConnectionHostDriver {
  constructor(transport: ClientTransport) {
    super(transport, {
      resolve: ResolveConnectionsQuery,
      load: LoadConnectionQuery,
      store: StoreConnectionAction,
      disconnect: DisconnectConnectionAction,
      token: IssueAccessTokenAction,
    });
  }
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
