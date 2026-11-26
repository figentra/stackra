# @stackra/integrations

## 0.33.1

### Patch Changes

- Updated dependencies [bf2c6ea]
  - @stackra/contracts@0.33.1
  - @stackra/actions@0.33.1
  - @stackra/clients@0.33.1
  - @stackra/money@0.33.1
  - @stackra/data-transfer@0.33.1
  - @stackra/config@0.33.1
  - @stackra/container@0.33.1
  - @stackra/errors@0.33.1
  - @stackra/events@0.33.1
  - @stackra/market-packs@0.33.1
  - @stackra/validation@0.33.1

## 0.33.0

### Patch Changes

- Updated dependencies [54aa1e7]
- Updated dependencies [82c2718]
- Updated dependencies [93d63bb]
- Updated dependencies [ad4e5bf]
- Updated dependencies [7c34d68]
- Updated dependencies [26a2d54]
- Updated dependencies [7c34d68]
- Updated dependencies [7c34d68]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
  - @stackra/actions@0.33.0
  - @stackra/config@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/market-packs@0.33.0
  - @stackra/clients@0.33.0
  - @stackra/data-transfer@0.33.0
  - @stackra/errors@0.33.0
  - @stackra/money@0.33.0
  - @stackra/container@0.33.0
  - @stackra/events@0.33.0
  - @stackra/validation@0.33.0

## 0.32.0

### Patch Changes

- Updated dependencies [9ddce28]
  - @stackra/config@0.32.0
  - @stackra/actions@0.32.0
  - @stackra/clients@0.32.0
  - @stackra/errors@0.32.0
  - @stackra/market-packs@0.32.0
  - @stackra/data-transfer@0.32.0
  - @stackra/money@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/events@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [298af71]
- Updated dependencies [6473cf1]
  - @stackra/actions@0.31.0
  - @stackra/clients@0.31.0
  - @stackra/data-transfer@0.31.0
  - @stackra/money@0.31.0
  - @stackra/config@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/errors@0.31.0
  - @stackra/events@0.31.0
  - @stackra/market-packs@0.31.0
  - @stackra/validation@0.31.0

## 0.30.0

### Patch Changes

- Updated dependencies [418e195]
- Updated dependencies [6005425]
- Updated dependencies [0394e56]
- Updated dependencies [96b5241]
- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [0394e56]
- Updated dependencies [8c17109]
- Updated dependencies [8c17109]
- Updated dependencies [82dccb3]
- Updated dependencies [f6a087c]
- Updated dependencies [ef49e63]
- Updated dependencies [d5a7d0a]
  - @stackra/actions@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/data-transfer@0.30.0
  - @stackra/container@0.30.0
  - @stackra/clients@0.30.0
  - @stackra/money@0.30.0
  - @stackra/config@0.30.0
  - @stackra/events@0.30.0
  - @stackra/market-packs@0.30.0
  - @stackra/validation@0.30.0

## 0.29.0

### Minor Changes

- 4cc17e5: `IntegrationCategory.Tax` (`tax`): the marketplace shelf for tax authorities, e-invoicing clearance and reporting
  networks and tax engines, so Invoicing & Tax finds a fiscal unit's Connection with `connectionsOf` (ADR 0447 as
  amended, STA-2607).
- 1b88340: `webhooks.eventId` can name several parts, `{ parts: [{ path }, { header }] }`, joined with `:` into one inbox id, for a provider whose events carry no unique id of their own (an order id plus its state plus the delivery timestamp). The receiver refuses an event whose named part is missing with `WebhookEventIdMissingError` instead of keying it by an empty id, which would have deduplicated every such event as one; this applies to the single `{ path }` form too.

### Patch Changes

- Updated dependencies [3361957]
- Updated dependencies [b4b6422]
- Updated dependencies [0e8f570]
- Updated dependencies [45afd22]
  - @stackra/actions@0.29.0
  - @stackra/container@0.29.0
  - @stackra/clients@0.29.0
  - @stackra/money@0.29.0
  - @stackra/data-transfer@0.29.0
  - @stackra/config@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/events@0.29.0
  - @stackra/market-packs@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [2b6f88c]
  - @stackra/actions@0.28.0
  - @stackra/clients@0.28.0
  - @stackra/data-transfer@0.28.0
  - @stackra/money@0.28.0
  - @stackra/config@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0
  - @stackra/events@0.28.0
  - @stackra/market-packs@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Minor Changes

- df74e1d: The managed client gains `api.send({ method, path, headers, body, idempotencyKey, signal })`, which answers
  `{ status, headers, body }` as the provider sent it, at every status, for a caller that must read a refusal's body (a
  fiscal authority's validation result). Auth, the egress rule (the path stays under the Integration's `baseUrl`), rate
  limits and the transient retries are those of the typed calls; once retries are spent the last answer is returned, and
  `ProviderUnavailableError` is thrown only when nothing came back. `fakeIntegrationApi` answers `send` from its routes
  (STA-2607).

### Patch Changes

- 7d284f2: `WebhookReceiver` parses a verified body by its recipe's `bodyFormat`: `json` (the default) as before, or `form`, an
  `application/x-www-form-urlencoded` body read into percent-decoded string values, which route the event
  (`eventType.path`), key it (`eventId.path`) and create it. A verified form-encoded delivery no longer throws a
  `SyntaxError` before routing. `WebhookSchemeRecipe.bodyFormat` now documents that it governs both the verifier and the
  receiver.
- Updated dependencies [8a70552]
  - @stackra/data-transfer@0.27.0
  - @stackra/clients@0.27.0
  - @stackra/actions@0.27.0
  - @stackra/money@0.27.0
  - @stackra/config@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0
  - @stackra/events@0.27.0
  - @stackra/market-packs@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Minor Changes

- ceceef3: A managed client call can send a raw body with its own media type (`RequestOptions.body: { content, contentType }`,
  a SOAP envelope) and read the answer as text (`text: true`); auth, retries, rate limits and the egress rule are
  unchanged, and `fakeIntegrationApi` hands the raw body to the route as its text (STA-2617).

### Patch Changes

- 031a1f7: `keyed_field_digest` takes four optional recipe fields, each defaulting to today's behaviour so existing recipes are
  unchanged: `secretAt: "start" | "end"` (default `end`), `separator` (default nothing), `algorithm` now also `SHA-1`,
  and `bodyFormat: "json" | "form"` (default `json`), where a form body is read as
  `application/x-www-form-urlencoded` with its values percent-decoded. A missing value is an empty string.
  `WebhookSchemeRecipe` gains the fields.
- 9d0dd67: A new `labelled_field_hmac` signature scheme: a hex HMAC (SHA-256 or SHA-512) over each label followed by its body
  field's value, in order, carried in a header or a query parameter and compared in constant time
  (`verifyLabelledFieldHmac`). The recipe names the fields as `labelledFields: [{ label, path }]` and may set
  `currencyDecimals: { path, currencyPath }`, which writes that amount with the minor-unit decimals of the ISO 4217
  currency at `currencyPath` from `@stackra/money`'s table (3 for KWD, BHD and OMR, 0 for JPY). A missing field, or an
  amount the currency cannot hold, does not verify. `WebhookSchemeRecipe` gains both fields.
- Updated dependencies [9cee75d]
  - @stackra/actions@0.26.0
  - @stackra/clients@0.26.0
  - @stackra/data-transfer@0.26.0
  - @stackra/money@0.26.0
  - @stackra/config@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/errors@0.26.0
  - @stackra/events@0.26.0
  - @stackra/market-packs@0.26.0
  - @stackra/validation@0.26.0

## 0.25.0

### Patch Changes

- @stackra/data-transfer@0.25.0
  - @stackra/clients@0.25.0
  - @stackra/actions@0.25.0
  - @stackra/money@0.25.0
  - @stackra/config@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/errors@0.25.0
  - @stackra/events@0.25.0
  - @stackra/market-packs@0.25.0
  - @stackra/validation@0.25.0

## 0.24.0

### Patch Changes

- Updated dependencies [35959f6]
- Updated dependencies [f86dec4]
  - @stackra/actions@0.24.0
  - @stackra/clients@0.24.0
  - @stackra/data-transfer@0.24.0
  - @stackra/money@0.24.0
  - @stackra/config@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/errors@0.24.0
  - @stackra/events@0.24.0
  - @stackra/market-packs@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Minor Changes

- d002763: `./testing` adds `liveConnection(ConnectionClass, { integration, fields, secrets })`: a connection whose `api` is the
  real managed client (the Integration's auth, base URL, headers, retry and rate limits over memory stores and the system
  clock), so a connector certification suite in a product can run a connector against a provider sandbox without a
  service or a ConnectionStore.

### Patch Changes

- c0237a4: A provider's error code no longer carries a credential into `ProviderRefusedError`. The managed client and
  `requestToken` replace a code that equals or contains a value the call sent with `"[redacted]"`. For the managed client
  that means a connection's or an Integration's `@Secret` value, a placeholder value filled into the auth, the Basic
  credential, the signed JWT or the OAuth bearer; for `requestToken`, the client secret or a grant's code, verifier, refresh
  token or assertion. `providerCodeOf` now takes only letters, digits, `_`, `.` and `-`, at most 64 characters.
- 1d76993: `RegionMapProviderDefaultsDriver` is `internal`: `SpeechService` builds it, so a host's `ProviderDefaults` has one
  candidate, the market-pack driver. With two and no config to choose, a host that reached the port failed at boot with
  `UnresolvedPortError` (Commerce channels).
- Updated dependencies [a42a80c]
  - @stackra/clients@0.23.0
  - @stackra/actions@0.23.0
  - @stackra/data-transfer@0.23.0
  - @stackra/money@0.23.0
  - @stackra/config@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/errors@0.23.0
  - @stackra/events@0.23.0
  - @stackra/market-packs@0.23.0
  - @stackra/validation@0.23.0

## 0.22.0

### Patch Changes

- 41f3da5: `Integration({ auth: { type: AuthType.Basic } })` takes an empty password, as RFC 7617 allows: a provider whose API key is
  the whole credential (Medusa, Stripe) sends `key:`. A user name is still required.
- ae24e3c: `RequestOptions.bytes`: a managed client call can read the answer as raw bytes (a `Uint8Array`) instead of parsing it
  as JSON, for a provider that returns a label PDF or an image. The call asks for any media type unless it sets
  `accept`. A refusal's body is still read for the provider's code.
- Updated dependencies [786848c]
- Updated dependencies [acbee14]
  - @stackra/actions@0.22.0
  - @stackra/events@0.22.0
  - @stackra/clients@0.22.0
  - @stackra/data-transfer@0.22.0
  - @stackra/money@0.22.0
  - @stackra/config@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/errors@0.22.0
  - @stackra/market-packs@0.22.0
  - @stackra/validation@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0
  - @stackra/validation@0.21.0
  - @stackra/actions@0.21.0
  - @stackra/clients@0.21.0
  - @stackra/money@0.21.0
  - @stackra/data-transfer@0.21.0
  - @stackra/config@0.21.0
  - @stackra/container@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/events@0.21.0
  - @stackra/market-packs@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [667a3b5]
- Updated dependencies [a7b7e58]
- Updated dependencies [667a3b5]
  - @stackra/actions@0.20.0
  - @stackra/container@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/clients@0.20.0
  - @stackra/money@0.20.0
  - @stackra/data-transfer@0.20.0
  - @stackra/config@0.20.0
  - @stackra/errors@0.20.0
  - @stackra/events@0.20.0
  - @stackra/market-packs@0.20.0
  - @stackra/contracts@0.20.0

## 0.19.0

### Minor Changes

- cb26737: Secrets now come from SOPS files keyed by Google Cloud KMS, not Infisical (ADR 0525). `@stackra/config` no longer
  ships the Infisical secret store: `InfisicalSecretStoreDriver`, `InfisicalConfig`, `InfisicalConfig$` and
  `InfisicalOptions` are removed, with the `infisical` candidate of the `SecretStore` port and the
  `INFISICAL_CLIENT_ID` and `INFISICAL_CLIENT_SECRET` env rows. The `SecretStore` candidates are now `memory` and
  `aws_secrets_manager`; a deployed runtime still reads the platform's own store through `envSecrets`. Re-run
  `stackra gen` after upgrading so a committed `stackra.manifest.json` drops the `infisical` candidate. The other
  packages only update comments and docs that named Infisical as the runtime store.

### Patch Changes

- Updated dependencies [58e3066]
- Updated dependencies [58a8fa5]
- Updated dependencies [cb26737]
- Updated dependencies [bac874e]
- Updated dependencies [0da5f7a]
- Updated dependencies [0921f1f]
- Updated dependencies [0e0de4f]
- Updated dependencies [0e0de4f]
  - @stackra/contracts@0.19.0
  - @stackra/actions@0.19.0
  - @stackra/config@0.19.0
  - @stackra/clients@0.19.0
  - @stackra/money@0.19.0
  - @stackra/data-transfer@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/events@0.19.0
  - @stackra/market-packs@0.19.0
  - @stackra/validation@0.19.0

## 0.18.1

### Patch Changes

- @stackra/clients@0.18.1
  - @stackra/actions@0.18.1
  - @stackra/money@0.18.1
  - @stackra/data-transfer@0.18.1
  - @stackra/config@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/events@0.18.1
  - @stackra/market-packs@0.18.1
  - @stackra/validation@0.18.1

## 0.18.0

### Patch Changes

- @stackra/clients@0.18.0
  - @stackra/actions@0.18.0
  - @stackra/money@0.18.0
  - @stackra/data-transfer@0.18.0
  - @stackra/config@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/events@0.18.0
  - @stackra/market-packs@0.18.0
  - @stackra/validation@0.18.0

## 0.17.2

### Patch Changes

- @stackra/clients@0.17.2
  - @stackra/actions@0.17.2
  - @stackra/money@0.17.2
  - @stackra/data-transfer@0.17.2
  - @stackra/config@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/events@0.17.2
  - @stackra/market-packs@0.17.2
  - @stackra/validation@0.17.2

## 0.17.1

### Patch Changes

- Updated dependencies [0b917cf]
  - @stackra/market-packs@0.17.1
  - @stackra/clients@0.17.1
  - @stackra/actions@0.17.1
  - @stackra/money@0.17.1
  - @stackra/data-transfer@0.17.1
  - @stackra/config@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/events@0.17.1
  - @stackra/validation@0.17.1

## 0.17.0

### Patch Changes

- @stackra/actions@0.17.0
  - @stackra/clients@0.17.0
  - @stackra/money@0.17.0
  - @stackra/data-transfer@0.17.0
  - @stackra/config@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/events@0.17.0
  - @stackra/market-packs@0.17.0
  - @stackra/validation@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/actions@0.16.0
  - @stackra/clients@0.16.0
  - @stackra/config@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/events@0.16.0
  - @stackra/market-packs@0.16.0
  - @stackra/data-transfer@0.16.0
  - @stackra/money@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- @stackra/data-transfer@0.15.0
  - @stackra/clients@0.15.0
  - @stackra/actions@0.15.0
  - @stackra/money@0.15.0
  - @stackra/config@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/events@0.15.0
  - @stackra/market-packs@0.15.0
  - @stackra/validation@0.15.0

## 0.14.4

### Patch Changes

- @stackra/clients@0.14.4
  - @stackra/actions@0.14.4
  - @stackra/money@0.14.4
  - @stackra/data-transfer@0.14.4
  - @stackra/config@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/events@0.14.4
  - @stackra/market-packs@0.14.4
  - @stackra/validation@0.14.4

## 0.14.3

### Patch Changes

- @stackra/actions@0.14.3
  - @stackra/clients@0.14.3
  - @stackra/money@0.14.3
  - @stackra/data-transfer@0.14.3
  - @stackra/config@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/events@0.14.3
  - @stackra/market-packs@0.14.3
  - @stackra/validation@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/actions@0.14.2
  - @stackra/clients@0.14.2
  - @stackra/money@0.14.2
  - @stackra/data-transfer@0.14.2
  - @stackra/config@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/events@0.14.2
  - @stackra/market-packs@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/actions@0.14.1
  - @stackra/clients@0.14.1
  - @stackra/money@0.14.1
  - @stackra/data-transfer@0.14.1
  - @stackra/config@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/events@0.14.1
  - @stackra/market-packs@0.14.1
  - @stackra/validation@0.14.1

## 0.14.0

### Patch Changes

- @stackra/actions@0.14.0
  - @stackra/clients@0.14.0
  - @stackra/money@0.14.0
  - @stackra/data-transfer@0.14.0
  - @stackra/config@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/events@0.14.0
  - @stackra/market-packs@0.14.0
  - @stackra/validation@0.14.0

## 0.13.0

### Patch Changes

- @stackra/actions@0.13.0
  - @stackra/clients@0.13.0
  - @stackra/money@0.13.0
  - @stackra/data-transfer@0.13.0
  - @stackra/config@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/events@0.13.0
  - @stackra/market-packs@0.13.0
  - @stackra/validation@0.13.0

## 0.12.0

### Patch Changes

- @stackra/actions@0.12.0
  - @stackra/clients@0.12.0
  - @stackra/money@0.12.0
  - @stackra/data-transfer@0.12.0
  - @stackra/config@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/events@0.12.0
  - @stackra/market-packs@0.12.0
  - @stackra/validation@0.12.0

## 0.11.1

### Patch Changes

- @stackra/actions@0.11.1
  - @stackra/clients@0.11.1
  - @stackra/money@0.11.1
  - @stackra/data-transfer@0.11.1
  - @stackra/config@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/events@0.11.1
  - @stackra/market-packs@0.11.1
  - @stackra/validation@0.11.1

## 0.11.0

### Patch Changes

- @stackra/actions@0.11.0
  - @stackra/clients@0.11.0
  - @stackra/money@0.11.0
  - @stackra/data-transfer@0.11.0
  - @stackra/config@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/events@0.11.0
  - @stackra/market-packs@0.11.0
  - @stackra/validation@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
  - @stackra/config@0.10.0
  - @stackra/contracts@0.10.0
  - @stackra/actions@0.10.0
  - @stackra/clients@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/market-packs@0.10.0
  - @stackra/money@0.10.0
  - @stackra/data-transfer@0.10.0
  - @stackra/container@0.10.0
  - @stackra/events@0.10.0
  - @stackra/validation@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [e80a99b]
- Updated dependencies [681d01a]
- Updated dependencies [2e43c48]
- Updated dependencies [f9c825d]
  - @stackra/validation@0.9.0
  - @stackra/clients@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/container@0.9.0
  - @stackra/actions@0.9.0
  - @stackra/config@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/events@0.9.0
  - @stackra/market-packs@0.9.0
  - @stackra/money@0.9.0
  - @stackra/data-transfer@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [7dd35b3]
  - @stackra/container@0.8.0
  - @stackra/actions@0.8.0
  - @stackra/clients@0.8.0
  - @stackra/money@0.8.0
  - @stackra/data-transfer@0.8.0
  - @stackra/config@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/events@0.8.0
  - @stackra/market-packs@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/clients@0.7.1
  - @stackra/actions@0.7.1
  - @stackra/money@0.7.1
  - @stackra/data-transfer@0.7.1
  - @stackra/config@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/events@0.7.1
  - @stackra/market-packs@0.7.1
  - @stackra/validation@0.7.1

## 0.7.0

### Patch Changes

- @stackra/clients@0.7.0
  - @stackra/actions@0.7.0
  - @stackra/money@0.7.0
  - @stackra/data-transfer@0.7.0
  - @stackra/config@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/events@0.7.0
  - @stackra/market-packs@0.7.0
  - @stackra/validation@0.7.0

## 0.6.1

### Patch Changes

- @stackra/actions@0.6.1
  - @stackra/clients@0.6.1
  - @stackra/money@0.6.1
  - @stackra/data-transfer@0.6.1
  - @stackra/config@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/events@0.6.1
  - @stackra/market-packs@0.6.1
  - @stackra/validation@0.6.1

## 0.6.0

### Patch Changes

- @stackra/actions@0.6.0
  - @stackra/clients@0.6.0
  - @stackra/money@0.6.0
  - @stackra/data-transfer@0.6.0
  - @stackra/config@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/events@0.6.0
  - @stackra/market-packs@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- @stackra/data-transfer@0.5.1
  - @stackra/clients@0.5.1
  - @stackra/actions@0.5.1
  - @stackra/money@0.5.1
  - @stackra/config@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/events@0.5.1
  - @stackra/market-packs@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- @stackra/clients@0.5.0
  - @stackra/actions@0.5.0
  - @stackra/money@0.5.0
  - @stackra/data-transfer@0.5.0
  - @stackra/config@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/events@0.5.0
  - @stackra/market-packs@0.5.0
  - @stackra/validation@0.5.0

## 0.4.0

### Patch Changes

- 5f63e58: `Integration({ key })` takes an optional written key of two snake_case parts (`connectors.stripe`), for an Integration
  whose key stored data already names (STA-1739). Gen's manifest uses it in place of the derived
  `<module>.<snake(class)>`, refuses a malformed one (`integration_key_invalid`) and still refuses two Integrations with
  one key (`identity_collision`). Without `key`, nothing changes.
- Updated dependencies [71b37fc]
- Updated dependencies [7a94bc4]
- Updated dependencies [a7eaed4]
- Updated dependencies [a8c358a]
- Updated dependencies [0b660e0]
- Updated dependencies [0b660e0]
- Updated dependencies [9c8d108]
- Updated dependencies [3c30885]
- Updated dependencies [c9cf778]
- Updated dependencies [1856ee0]
- Updated dependencies [ca7d004]
- Updated dependencies [eccdaf0]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [90f55b1]
- Updated dependencies [688cf0c]
- Updated dependencies [ff56870]
- Updated dependencies [e219411]
- Updated dependencies [79dc807]
- Updated dependencies [5fc0db7]
- Updated dependencies [8d29426]
  - @stackra/actions@0.4.0
  - @stackra/validation@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/container@0.4.0
  - @stackra/events@0.4.0
  - @stackra/data-transfer@0.4.0
  - @stackra/market-packs@0.4.0
  - @stackra/clients@0.4.0
  - @stackra/config@0.4.0
  - @stackra/errors@0.4.0
  - @stackra/money@0.4.0

## 0.3.0

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- 869d976: A `baseUrl` may be exactly one `{field}` placeholder, so the whole URL comes from the connection or credential set
  (STA-1665). The managed client accepts a resolved `http:` origin only on an `.internal` host (the private tools
  namespace, until TLS there, STA-1653); any other resolved origin must be https.
- Updated dependencies [a60f4e9]
- Updated dependencies [c4443b5]
- Updated dependencies [b00096a]
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [30c3874]
- Updated dependencies [18ea367]
- Updated dependencies [e6a582a]
  - @stackra/actions@0.3.0
  - @stackra/clients@0.3.0
  - @stackra/config@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/data-transfer@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/events@0.3.0
  - @stackra/market-packs@0.3.0
  - @stackra/money@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [2d5a888]
- Updated dependencies [9085c41]
  - @stackra/actions@0.2.0
  - @stackra/errors@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/clients@0.2.0
  - @stackra/data-transfer@0.2.0
  - @stackra/market-packs@0.2.0
  - @stackra/money@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/events@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 072a443: Ad conversions on both sides with one dedup id. `@stackra/analytics` adds the `ad-pixel` driver of `AnalyticsDriver`
  (a destination gated by `marketing` that fires the tracked events `conversions` names on the new `AdPixel` port, with
  the `ref` property's value as the event id), the `none` `AdPixel` driver, the `conversions` and `adPixelDriver`
  settings, and `adClickIdOf` for the landing URL's ad click id. `@stackra/integrations` adds the conversion bridge:
  `Conversion` (payload paths), `conversionOf` and `ConversionBridge`, which send an integration event such as
  `order.placed` through `gateway.ads()` only when its consent grants `marketing`; `ConversionEvent` carries that consent
  and `AdPlatformConnector` an optional `phoneFormat`.
- 2ead19c: Breaking renames for unique public names (STA-1383): the accounting-export types `JournalEntry` and `JournalLine` of
  `@stackra/integrations/contracts` are `AccountingJournalEntry` and `AccountingJournalLine`, so `JournalEntry` and
  `JournalLine` are only `@stackra/ledger`'s.
- a9d39cf: Accounting journals (STA-794, stackra-44): account mapping per Connection (`AccountMap` and `AccountMapped` in
  `./contracts`, `mapJournal`, `postMappedJournal`, `UnmappedAccountError`), so a journal in our account and tax keys is
  posted once in the tenant's provider codes and an unmapped key posts nothing. `./testing` adds
  `MemoryAccountingConnector` and the recorded-case runner every accounting driver passes (`replayIntegrationApi`,
  `runAccountingCase`, `AccountingCase`, `RecordedExchange`), with recordings marked certification pending until a sandbox
  capture. The Xero, QuickBooks Online, Zoho Books, Qoyod and Daftra drivers are OS integrations connectors (ADR 0443
  decision 7).
- ae5f6cd: Marketplaces, 3PLs and ad platforms (STA-793, stackra-45). `./contracts` adds `AdPlatformConnector` (server-side
  conversions and customer-audience sync), `ConversionEvent`, `MatchKeys` and `AdBatchResult`; `ConnectorKind.AdPlatform`
  (`ad_platform`) and `ConnectorGateway#ads`; `matchKeysOf` normalises and SHA-256 hashes a person's email, phone (E.164
  or digits, a Connection setting) and id. The managed client sends an OAuth token in the header and layout `auth.token`
  names (`x-amz-access-token`, `access-token`) and adds the Integration's new `headers` option (Google Ads'
  `developer-token`). `./testing` adds `runConnectorCase` and `ConnectorCase`/`ConnectorStep` (any connector contract),
  `runFulfilmentCase` and `FulfilmentCase` (3PL, the repeat hand-over built in) and `MemoryAdPlatform`. The Amazon, noon,
  Salla, Zid, Meta, TikTok, Snap, Google and 3PL connectors are OS integrations connectors (ADR 0443 decision 7),
  certification pending.
- 24671ba: Add `ClientConnectionHostDriver`, the `ConnectionHost` over the integrations service's generated client (the host passes
  its refs as `ConnectionHostCalls`); export `requestToken` with its `TokenRequest` (the endpoint and client as data) for
  a store host's code exchange and refresh; `ConnectionHost#store` takes an optional `credentialsExpireAt`, filled from
  `ConnectInput.credentialsExpireAt` by the hosted store.
- 975a6c1: Add the `./contracts` entry with the `ConnectionContext` port, which moves there from `.` (ADR 0294 decision 15).
  `ConnectionStore` and `ConnectionHost` stay in `.`. Add `RequestConnectionContextDriver`, the `request`
  `ConnectionContext`: the running call's scope and the user it acts for (`actor.onBehalfOf ?? actor` when that is a
  user), read from `@stackra/actions`' `RequestContext`; undefined outside a call.
- 865cf77: Add `connectionsOf`, the lookup of registered connection classes by connector kind or category, and
  `ConnectorGateway`, which resolves the Connection of a fulfilment provider (3PL, WMS), sales channel, product feed, EDI
  network, fraud scorer or document store by provider or by the ADR 0356 pick (ADR 0447). Extend
  `SalesChannelConnector` with optional reject, cancel, prep time, menu with modifier groups, availability, listing
  content and returns, and `ChannelOrder` with `paymentMethod`. Add the `EdiConnector`, `FraudScoringConnector` (the score
  is a rule fact) and `DocumentStoreConnector` contracts with the `edi`, `fraud_scoring` and `document_store` connector
  kinds, the `edi`, `fraud`, `food_delivery`, `courier`, `document_management`, `esl`, `scales` and `court` categories,
  and `MemoryFulfilmentProvider` in `./testing`.
- 90e65ce: <!--
  Stackra file contract:
  Purpose: release note of stackra-46 (STA-1123): the EDI envelope, acknowledgements, mailbox connector and recorded-case runner.
  Boundary: changeset only.
  Runtime: none
  Governing contract: ADR 0447 (decision 4); ADR 0443 (decisions 7 and 8); stackra-46 re-scope (R2-7, M6).
  -->
  
  Add the EDI machinery behind `EdiConnector`, certification pending: `readInterchange` and `writeInterchange` (ASC X12
  ISA/GS/ST and UN/EDIFACT UNA/UNB/UNH envelopes with trailer checks), `functionalAcknowledgement` (997 and CONTRL),
  `MailboxEdiConnector` over the new `EdiMailbox` transport port (`./contracts`, with `EdiSyntax` and the interchange
  types), `MemoryEdiMailbox`, `EDI_MESSAGE_CODES` and `MalformedEdiError`; `./testing` adds `runEdiCase` and `EdiCase`
  for OS EDI connectors' recordings. Transport and network vendor connectors stay in OS integrations.
- 0046fbd: Add `ProviderResolver#candidates`, the ordered failover list with `ProviderMode` (own or managed) per entry, and a
  Market argument on `resolve`; `ProviderChoice.connectionId` is optional. Add `MarketPackProviderDefaultsDriver` over
  `ProviderPackSource`, the `payroll` category with the `PayrollConnector` contract, `assertPayInputs` and
  `MemoryPayrollConnector` (ADR 0422).
- 834d55b: Managed or bring-your-own connectors, form bodies and the JWT bearer grant (STA-792, STA-672). An Integration may ask
  for form-encoded request bodies (`requestBody: "form"`) and declare an HMAC webhook signature recipe
  (`webhooks.signature`, `WebhookSignature`) and an event id path. A seventh auth type, `OAuth2JwtBearer`, signs a
  service-account assertion and caches the token it trades for. A Connection carries its `source` (`ProviderSource`:
  managed or BYO) and a managed `resourceId`. `./contracts` adds the `ManagedProvisioning` port with `ManagedResource`,
  `ManagedCostEvent`, `ProvisioningRequest`, `ProvisioningStatus`, `ProviderCategoryRecord` and `ProviderCatalogueEntry`;
  `.` adds `MemoryManagedProvisioningDriver` and the `PROVIDER_CATEGORY_SEEDS`, `PROVIDER_CATALOGUE_SEEDS` (US and EU
  payment gateways) and `MANAGED_PROVISIONING_TEMPLATES` seeds.
- c2b8ed4: `MemoryEdiMailbox` is renamed `MemoryEdiMailboxDriver`, the driver kind's name for its `memory-edi-mailbox.driver.ts`
  file (gen refused the old name as `kind_class_name`). Import the new name.
- 2787c1e: Add `@stackra/integrations`, provider integrations (ADR 0308): the `Integration({ provider, category, levels, auth,
  ... })` and `Connection<I>` kind bases, the managed client behind `api` with the six auth types, rate limits, retries and
  typed refusals (`ProviderRefusedError`, `ProviderUnavailableError`, `ConnectionCheckFailedError`,
  `InvalidSignatureError`), the `ConnectionStore` port with its `local` and `hosted` drivers, and `fakeIntegrationApi`,
  `makeConnection`, `.withIntegrationApi` and `.withConnection` for tests.
- 47cc2f6: Add the five Integration roles and connector kinds (ADR 0355), a fuller listing (support, privacy and terms links and an
  Entitlement reference), the `booking`, `telephony` and `wallet` categories, and per-region base URLs with `{field}`
  placeholders and form bodies in the managed client. Add `ProviderResolver` with the `ProviderDefaults` and
  `MarketContext` ports for choosing a provider per tenant and Market (ADR 0356), `credentialRef` for credential vault
  references, `postJournal` and `assertBalanced` for balanced, idempotent journals behind the `AccountingProvider`
  interface, the `SalesChannelConnector`, `ProductFeedConnector` and `FulfilmentProviderConnector` interfaces, the
  telephony port (`VoiceGateway`, `CallInstruction`, `CallStatus`, `RecordingConsent`, `recordingPlan`), the `Pass` kind
  for wallet passes, and the headless Chatwoot integration (Platform API provisioning, inboxes, contacts, conversations,
  messages, assignment).
- 2432cca: Voice: SIP trunk driver (ADR 0376 decision 7, RV-51, STA-1092), certification pending (owner D3). `./node` adds
  `SipVoiceGateway`, a `VoiceGateway` over a carrier SIP trunk that places calls (INVITE with MD5 or SHA-256 digest
  auth, ring timeout by CANCEL), receives them, registers when configured, and runs each call's instructions itself
  (`say` and `listen` through `SpeechService` over the new `RtpAudioDeviceDriver`, `play` from a WAV in the call's G.711
  codec, `handover` by REFER, `hang_up` by BYE), posting statuses and metering answered minutes through `VoiceMeter`.
  Configuration is `SipTrunkOptions`; credentials are the secret names in `SIP_TRUNK_SECRETS`. Recording is refused
  (501 `recording_unsupported`); UDP only.
- ffda24c: Voice channel (ADR 0376 decision 7, STA-1070): the `Speech` port (streaming speech to text and text to speech over raw
  audio, `./contracts`) with `SpeechService`, which picks the speech Connection of the tenant's data region from
  `region-map:<region>.providers.speech` (new `RegionMapSource` port and `RegionMapProviderDefaultsDriver`), honours
  `zeroRetention`, and runs over a local `AudioDevice` (new port, `MemoryAudioDeviceDriver`). `VoiceMeter` writes
  `usage.recorded` on `voice.minutes` per finished call and `speech.seconds` per stream (`VOICE_METERS`, `audioSeconds`).
  `VoicePack` reads the pack's dialects, consent rule (strictest when missing) and its notice and question text;
  `consentSteps` and `handoverSteps` build the call steps. New dependency: `@stackra/events`.
- fa0ed99: Wallet pass issuing (ADR 0348 decision 5, STA-791). `./contracts` adds the `CmsSigner` host port (a detached CMS
  SignedData signature). A new `./node` entry adds `PkijsCmsSignerDriver` (pkijs and Web Crypto, certificate, key and
  chain read by secret name, `APPLE_WALLET_SIGNER_SECRETS`), the `WalletPassIssuer` port with `WalletPassRequest` and
  `IssuedWalletPass`, `AppleWalletPassDriver` (`applePassJson`, `buildPkpass`: pass.json, brand-kit images, SHA-1
  manifest, signature, zip) and `GoogleWalletPassDriver` (`googleWalletObject`; the generic object written through the
  Google Wallet Integration's JWT bearer `api`, insert or update, and an RS256 save link). New dependencies:
  `@stackra/data-transfer`, `pkijs`, `asn1js` (catalog entries for the integration batch).
- 09823c1: `IntegrationWebhooks` takes an optional `recipe` (`WebhookSchemeRecipe`): the data of a webhook scheme that is not an
  HMAC over the raw body (where the token, signature or JWT sits, the ordered signed fields and their decimals, the hash,
  an encrypted body's IV and tag headers), read by the new `@stackra/webhooks` schemes of the regional gateways
  (STA-1357). Type only; additive.
- 396e384: Packages ship their `stackra.manifest.json` (listed in `files`), and the manifest gains a `config` section that gen
  reads for package config rows instead of the `*Config` name suffix. `stackra gen --check` refuses an unshipped manifest
  (`manifest_unshipped`). New memory drivers: `ConnectionStore` (integrations), `ScopeResolver` (scope),
  `RealtimeFanout` (realtime), `ErrorReporter` (errors), `SecretStore` (config) and `FlagProvider` (feature-flags).
  Generated file headers keep ` *` on continuation lines, so every generated header changes on the next regeneration.
- 150fa18: The `Interval` string and the package's `RetryPolicy` type are removed. Every length (`rateLimits[].per`,
  `health.every`, `auth.expiresIn`, `auth.refresh.buffer`, `webhooks.signature.tolerance`, `saveLinkLifetime`) is a
  `Duration`; write `Duration.seconds(1)` or `Duration.parse("1s")`. `retry` is the contracts `RetryPolicy` plus
  `idempotencyHeader`: `backoff` and `maxDelay` became `base` and `max`, with the same defaults (3 attempts, 200 ms
  doubling, 30 s). (stackra-223)
- fc51f13: Move every vendor Integration out of Stackra (owner decision R3-8, STA-1281): the Stripe, Checkout.com, Moyasar,
  HyperPay, Paymob, Fawry, Tabby and Tamara drivers and `PAYMENT_CONNECTIONS`; the Resend, SES, Unifonic, Taqnyat,
  Twilio, Cequens, Meta WhatsApp and Expo drivers and the `*_CONNECTIONS` maps; and Chatwoot now live in the OS
  integrations service. The ports and shared machinery stay. `ConnectionPaymentGatewaysDriver` and the
  `Connection*TransportDriver`s take the host's connection class per provider code as their third argument, and
  `DevicePushTransportDriver` takes any Integration with a managed client for Expo; callers of the ports are unchanged.
- c7e6988: Add verification to the `ProviderResolver` capabilities (ADR 0376 decision 1 Note, STA-1282): `candidates` takes
  `pin` to keep one mode only, `VerificationUse` (`platform` or `tenant`) on `VerificationRequest`, the
  `VerificationCandidate` type and `VerificationService#verifyThrough`, which runs a platform check only through
  platform Connections and a tenant check through the tenant's own Connection first. `VerificationResult` gains `mode`.

### Patch Changes

- ae3d280: Add the `@stackra/config/contracts` entry and move the `SecretStore` port into it (one symbol, one entry): import it from
  `@stackra/config/contracts`; `@stackra/config` no longer exports it. Dependants import from the new entry.
- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- a681685: `AssuranceLevel` and `MeterKind` have one home, `@stackra/contracts` (STA-1383). Breaking: `@stackra/actions/contracts`
  and `@stackra/identity` no longer export `AssuranceLevel`, and `@stackra/actions` and `@stackra/model` no longer export
  `MeterKind`; import both from `@stackra/contracts`. The codes are unchanged.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- f04fec9: Make every declaration emit self-contained (TS2883, STA-1220): explicit types on `TierMultiplierExtension`'s base,
  `Dropdown`, the observability stack functions, `JOB_TYPES` and `SCHEDULED_JOBS`, and the type `PassBase` exported from
  `@stackra/integrations` so a consumer's `extends Pass({ key })` class can be declared.
- Updated dependencies [f81699d]
- Updated dependencies [f7fb4ad]
- Updated dependencies [e7a388a]
- Updated dependencies [68dd2a5]
- Updated dependencies [e0f2fc8]
- Updated dependencies [2787c1e]
- Updated dependencies [df3f38b]
- Updated dependencies [4413118]
- Updated dependencies [a6ec591]
- Updated dependencies [38fb3e2]
- Updated dependencies [0abe92d]
- Updated dependencies [bc4acfc]
- Updated dependencies [0202770]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [99665bb]
- Updated dependencies [8ead1a8]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [dddbbcd]
- Updated dependencies [e2a4b0d]
- Updated dependencies [b3c4658]
- Updated dependencies [975b28c]
- Updated dependencies [e7ee0a4]
- Updated dependencies [a701ccb]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [cc8db5e]
- Updated dependencies [e7a388a]
- Updated dependencies [2787c1e]
- Updated dependencies [27efea7]
- Updated dependencies [0a38324]
- Updated dependencies [2787c1e]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [c21a223]
- Updated dependencies [c1818fd]
- Updated dependencies [b88a78d]
- Updated dependencies [38ef655]
- Updated dependencies [c56d7fe]
- Updated dependencies [2787c1e]
- Updated dependencies [5fe0327]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [9fc14fd]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [37e1aa8]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [fd13f0e]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/events@0.1.0
  - @stackra/clients@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/data-transfer@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/market-packs@0.1.0
  - @stackra/money@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
