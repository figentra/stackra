# @stackra/integrations

Provider integrations (ADR 0308). An **Integration** describes a provider once, the same for every scope and user:
where its connections sit, how a call authenticates (six auth types), its base URL, rate limits, retries, health
schedule and webhook verification. A **Connection** is one stored credential set for it, supplied or granted by a scope
or a user. Both expose the same **managed client** (`api`), which authenticates, keeps to the rate limits, retries what
is safe and turns every provider outcome into a value or a typed refusal. This package absorbs the retired
`@stackra/connections`.

**Tier:** `tier:lib` (`packages/communication/integrations`). Entries `.` and `./testing`. Depends on
`@stackra/actions` (the `RateLimitStore`), `@stackra/config` (`@Secret`, `SecretStore`), `@stackra/container`,
`@stackra/contracts` and `@stackra/errors`.

## What is here

| Symbol                                                                                        | Use                                                                                  |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `Integration`                                                                                 | the kind base of a provider description; `api` uses the platform's own credentials   |
| `Connection`                                                                                  | the kind base of one credential set (`Connection<XIntegration>`), with `check()`     |
| `ConnectedAccount`                                                                            | what `check()` returns: the provider account's id and label                          |
| `AuthType`, `ConnectionLevel`, `IntegrationCategory`, `RateLimitScope`                        | the enums an Integration's options use                                               |
| `ConnectionStore`                                                                             | the port: `find`, `byId`, `list`, `connect`, `disconnect`                            |
| `LocalConnectionStoreDriver`, `HostedConnectionStoreDriver`                                   | `local` (in process, development) and `hosted` (the integrations service holds them) |
| `ConnectionContext`, `ConnectionHost`                                                         | the ports the drivers need: the call's owners, and the store host                    |
| `IntegrationRuntime`                                                                          | builds every Integration and its managed clients; holds and renews OAuth tokens      |
| `registerConnections`                                                                         | links each connection class to its Integration and key; gen emits the call           |
| `resolvePlaceholders`                                                                         | fills `{field}` placeholders, for `@stackra/webhooks`' secret lookup                 |
| `ProviderRefusedError`, `ProviderUnavailableError`                                            | a provider's 4xx, and spent retries or a full bucket                                 |
| `ConnectionCheckFailedError`, `ConnectionAmbiguousError`, `InvalidSignatureError`             | a failed `check()`, an ambiguous `find`, a webhook that does not verify              |
| `./testing`: `fakeIntegrationApi`, `makeConnection`, `.withIntegrationApi`, `.withConnection` | fakes of the managed client and the store for tests                                  |

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

## The six auth types

`OAuth2Code` (the connection holds the tokens; refreshed single-flight before they expire, revoked at disconnect),
`OAuth2ClientCredentials` (a token cached per credential), `ApiKey` (a header or a query parameter), `Basic`, `Jwt`
(HS256, RS256 or ES256, signed per call) and `None`. A provider outside the six is a driver that signs its own requests.

## Levels

`ConnectionLevel.User` is the user the call acts for; `ConnectionLevel.Scope` is the call's scope node, then each node
above it on its path. The scope tree's own levels (platform, product, tenant) are deployment data (ADR 0327), so this
package names none of them.

## Not here

- The webhook kind and its verification: `WebhookEvent` is `@stackra/events`'; verifying and routing is
  `@stackra/webhooks`, which reads `IntegrationWebhooks`.
- The OAuth consent flow (authorize URL, PKCE, code exchange) and the console's connect pages: the integrations service.
- A `ConnectionContext` driver: the runtime binds one that reads the call's scope and actor.
- Lifecycle events (`integrations.connection.*.v1`), tombstones and encryption at rest: the store host.
