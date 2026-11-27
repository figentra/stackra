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
| `./contracts` | `KmsClient`                                | the AWS KMS client the `kms` signer calls; the host binds its driver     |
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

A field mapped to a safety-critical variable (`SAFETY_CRITICAL_VARIABLES`: `STACKRA_ENVIRONMENT`, and the dev
sign-in's key set `STACKRA_DEV_ISSUER_KEYS`) is runtime-only: a value for it (a runway `config` block, a test's `values`) fails boot with `ConfigInvalidError` naming
the field and the variable, and `runway validate` refuses it before a deploy. A set `STACKRA_ENVIRONMENT` must name a
Stackra environment, so a typo fails boot instead of reading as some environment (STA-2844, ADR 0296 as amended on
2026-11-26).

## Secrets

A `@Secret` field is resolved by name through `SecretStore` and held in a non-enumerable getter: it never appears in
`JSON.stringify`, `Object.keys`, a spread, `console.log` or an error. Setting one through `env` or a values layer
throws. A schema with a secret never reaches a wire surface (gen's `secret_on_wire`).

## Secret store drivers

A deployed runtime reads its secrets from the platform's own store (`envSecrets` in `@stackra/app`), where runway's
sync writes them from `figentra/secrets` (ADR 0525). Beside it, the AWS Secrets Manager driver reads a deployment's
secrets into memory at boot; the runtime awaits `load()` before it builds the configuration that reads them (and again
after a rotation). No driver lists, logs or reports a value.

| Driver                               | Entry    | Configuration                                                                                                                                                    |
| ------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MemorySecretStoreDriver`            | `.`      | none: `memory`, the secrets a test sets (STA-1308)                                                                                                               |
| `AwsSecretsManagerSecretStoreDriver` | `./node` | `AwsSecretsManagerConfig`: region and secret ids; the runtime's AWS role signs the reads                                                                         |

`SecretsConfig.store` (key `config.secrets`) picks the driver: `memory` unless config says otherwise, so a member
boots with no secrets config; a deployment that reads AWS sets `store: aws_secrets_manager` in its runway values.

A JSON-object secret in AWS gives one secret per string member. `@aws-sdk/client-secrets-manager` is an optional peer.

## Signer drivers

A service that injects @stackra/contracts' `Signer` binds one of these drivers, configured by `SignerConfig` (key
`config.signer`), whose `driver` field picks it: `ephemeral` unless config says otherwise, so a member boots with no
signer config; production sets `driver: kms` with `kmsKeyId` in its runway values. They are the container's twins of the contracts classes `AwsKmsSignerDriver` and `MemorySignerDriver`,
which they delegate to; code that builds a signer by hand keeps using those.

- **`kms`, `KmsSignerDriver`:** signs inside AWS KMS with `kmsKeyId`, and names each signature `keyId` (or the KMS key
  id). It takes a `KmsClient`: the `aws-sdk` driver in `./node` (`AwsSdkKmsClientDriver`) builds `new KMS({ region })`
  of `@aws-sdk/client-kms`, an optional peer, on first use, with the runtime's role; a host may bind its own. An
  empty `kmsKeyId` is refused at the first signature.
- **`ephemeral`, `EphemeralSignerDriver`:** a key pair made in process on first use, for tests and local development.
  It is lost on restart, so a signature that must outlive the process never comes from it.

## The environment

```ts
// the browser: only VITE_ / EXPO_PUBLIC_ / RENDERER_VITE_ fields, plus isDevelopment
export const env = hydrateEnv(EnvConfig, import.meta.env, { only: "public" });
// the Worker: the whole instance, secrets resolved from the bindings by name
export const serverEnv = (raw: unknown) =>
  hydrateEnv(EnvConfig, { ...import.meta.env, ...(raw as object) });
```

## The running environment

`readEnvironment(raw, platform?)` is the one reader of the environment a process runs as. Every check that `dev` or
`test` relaxes (memory stores, an unbound audit trail, dev sign-in, a memory scanner or nonce store) asks it, and
`isDeployedEnvironment` is the one gate for "outside dev and test", so they all agree (STA-2844).

- The answer is one of `StackraEnvironment`: `dev`, `test`, `preview`, `staging`, `production`. Any other value of
  `STACKRA_ENVIRONMENT` (`prod`, `Production`, a typo) is refused with `ConfigInvalidError`; it never reads as some
  environment.
- It reads only the runtime: `STACKRA_ENVIRONMENT` in `raw` and what the serving platform reports (`platform`, the
  shape of Encore's `appMeta().environment`), never a configuration value.
- With no platform (a developer tool, a unit test) unset is `dev`. Under `encore run` unset is `dev`; under
  `encore test` it is `test`.
- On a deployed platform unset is derived: `production` for type `production`, `preview` for `ephemeral`, else the
  platform's name when it is `preview`, `staging` or `production`, else `staging`. `dev` or `test` declared there is
  refused, and so is a value the platform's type or name contradicts.
- A self-hosted image without infra metadata (empty name, cloud `local`) is not a developer machine: unset is refused,
  so it fails closed instead of running as `dev`.

```ts
import { isDeployedEnvironment, readEnvironment } from "@stackra/config";

if (isDeployedEnvironment(readEnvironment(process.env))) refuseMemoryDefaults();
```

A service gets the platform's report from the generated `stackra-encore/<member>/environment.ts`, which calls
`providePlatformEnvironment` of `@stackra/app/server` before the app loads.

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
