# @stackra/config

Stackra configuration: deploy-time values as classes. A configuration is `class X extends Config({ schema, env })`;
the class is the DI token, its key is derived, its fields come from the schema, and secrets are named on schema fields
with `@Secret("NAME")` and resolved blind.

**Tier:** `tier:lib` (`packages/foundation/config`). Entries `.`, `./contracts`, `./react` and `./testing`. Depends on
`@stackra/contracts`, `@stackra/container`, `@stackra/validation` and zod; React is an optional peer of `./react`.

## What is here

| Entry         | Symbol                                     | Use                                                                      |
| ------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| `.`           | `Config`                                   | `extends Config({ schema, env })`, called only                           |
| `.`           | `Secret`                                   | `@Secret("RESEND_API_KEY")` on a schema, integration or connection field |
| `.`           | `buildConfig`                              | the runtime's one way to make a configuration instance                   |
| `.`           | `hydrateEnv`                               | the generated `#stackra/env`: public part, or the whole instance         |
| `.`           | `env`                                      | `env.str()`, `env.url()`, `env.enum([...])` for build-time files         |
| `.`           | `configKey`                                | the key derivation gen shares                                            |
| `.`           | `ConfigInvalidError`                       | thrown at boot; names paths, variables and secrets, never values         |
| `.`           | `BuildFacts`, `PublicPart`, `ConfigValues` | types                                                                    |
| `./contracts` | `SecretStore`                              | the port secrets resolve through; the runtime binds its driver           |
| `./react`     | `useConfig`                                | `const site = useConfig(SiteConfig)` in a component                      |
| `./testing`   | `.withConfig`, `.withSecrets`              | added to `createTestingModule(...)` when the entry loads                 |

## Declaring a configuration

```ts
// src/schemas/commerce-options.schema.ts
export class CommerceOptions extends Schema {
  defaultCurrency: CurrencyCode = "USD";

  storefrontBaseUrl!: Url;

  @Secret("PRICING_API_KEY")
  pricingApiKey!: string;
}

// src/config/commerce.config.ts
export class CommerceConfig extends Config({
  schema: CommerceOptions,
  env: { storefrontBaseUrl: "STACKRA_STOREFRONT_BASE_URL" },
}) {}
```

Inject it by type (`constructor(private readonly config: CommerceConfig)`). A host overrides a package's
configuration under the same name, with the package class aliased `Base<Name>`, and `override` members only:

```ts
import { LoyaltyKitConfig as BaseLoyaltyKitConfig } from "@acme/loyalty-kit";

export class LoyaltyKitConfig extends BaseLoyaltyKitConfig {
  override maxRedeemPercent = 30;
  override ledger: DriverName<LoyaltyLedger> = "memory"; // a literal union restates its type
}
```

## Layers

Lowest first: the schema defaults, the host override, the `env` variables, runway's values for the key, then the
secrets. `buildConfig` validates the result with the schema's generated `X$` and freezes it. A nested object in a
later layer replaces the earlier one whole. An environment string is coerced to the type of the value it replaces.

## Secrets

A `@Secret` field is resolved by name through `SecretStore` and held in a non-enumerable getter: it never appears in
`JSON.stringify`, `Object.keys`, a spread, `console.log` or an error. Setting one through `env` or a values layer
throws. A schema with a secret never reaches a wire surface (gen's `secret_on_wire`).

## Secret store drivers

Two `SecretStore` drivers read a deployment's secrets into memory at boot; the runtime awaits `load()` before it
builds the configuration that reads them (and again after a rotation). Neither lists, logs or reports a value.

| Driver                               | Entry    | Configuration                                                                                                                                                    |
| ------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `InfisicalSecretStoreDriver`         | `.`      | `InfisicalConfig`: site, project, environment, folder; the machine identity is `INFISICAL_CLIENT_ID` and `INFISICAL_CLIENT_SECRET` from the platform's own store |
| `AwsSecretsManagerSecretStoreDriver` | `./node` | `AwsSecretsManagerConfig`: region and secret ids; the runtime's AWS role signs the reads                                                                         |

A JSON-object secret in AWS gives one secret per string member. `@aws-sdk/client-secrets-manager` is an optional peer.

## The environment

```ts
// the browser: only VITE_ / EXPO_PUBLIC_ / RENDERER_VITE_ fields, plus isDevelopment
export const env = hydrateEnv(EnvConfig, import.meta.env, { only: "public" });
// the Worker: the whole instance, secrets resolved from the bindings by name
export const serverEnv = (raw: unknown) =>
  hydrateEnv(EnvConfig, { ...import.meta.env, ...(raw as object) });
```

## Testing

```ts
const app = await createTestingModule(LoyaltyKitModule)
  .withConfig(LoyaltyKitConfig, { ledger: "memory", maxRedeemPercent: 30 })
  .withSecrets({ RESEND_WEBHOOK_SECRET: "whsec_test" })
  .compile();
```

`withConfig` validates as at boot and replaces the class (and the base a host override stands in for). A secret a
test does not set reads as `test-secret:<NAME>` inside a configuration; the bound `SecretStore` answers only the names
given.

Governing ADRs: 0146 (as amended by 0294 and 0305), 0294 (decisions 19 and 20), 0295, 0296 (decision 1), 0305
(rule 34), 0173, 0231, 0269.
