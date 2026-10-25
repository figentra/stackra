# Plan: `@stackra/config` wave 1d

**Spec**: `.agents/specs/sta-348-config/spec.md`

## Design

- `Config` is container's `createKind("config", ConfigBase)`, cast to a called-only signature
  `<S, const E>(options: ConfigOptions<S, E>) => ConfigClass<S, E>`. `ConfigClass` constructs a
  `Config<S, E> & Readonly<Fields<S>>`; the `Config` interface carries type-only `~kind` and `~config` (schema and
  literal env map) brands, which `PublicPart` reads. `ConfigBase`'s constructor copies `new schema()` onto `this`, so a host override's
  initializers land on top.
- `@Secret(name)` is a `createDecorator<string>` field decorator of kind `secret` that may mark the `schema`,
  `integration` and `connection` kinds, typed `FieldDecorator<string>`, with `Secret.members` to read it back. Names are SCREAMING_SNAKE.
- Building is two internal halves. `layerConfig` constructs, applies the env map (coercing strings by the replaced
  value's type) and the values layer, refusing a secret field in either. `sealConfig` resolves secrets through a
  resolver, parses with `schemaOf(schema)`, maps issues to `ConfigIssue`s (`issuesOf`: paths and variable or secret
  names, never values), assigns the parsed data, defines each secret as a non-enumerable getter and freezes.
  `buildConfig` composes them with a `SecretStore`; `hydrateEnv` composes them with a raw-record resolver and
  derivations, or, for `{ only: "public" }`, picks the public fields and parses them with `ZodObject.pick`.
- `configKey(Class, member)` snake-cases the root class's stem (`configRoot`: the class just below the `Config(...)`
  call, found by kind-record identity).
- `env` is a frozen object of `str`, `url`, `enum` parser factories over zod (`envValue`), each chain call returning
  a new parser.
- `./react`: `useConfig(Class)` is `useContainer().get(Class)`.
- `./testing`: `CONFIG_TESTING_PLUGIN` keeps per-builder state (secrets, configs) in a WeakMap; every call rebuilds
  each held configuration through `buildConfig` and overrides the class and its root; `.withSecrets` also overrides
  `SecretStore` with a store over the map. Registered on load; `declare module "@stackra/container/testing"` types it.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                              |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/foundation/config`; workspace imports: `@stackra/container`, `@stackra/contracts`, `@stackra/validation` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | PASS   | `@Secret` values are resolved blind through `SecretStore` and never serialised or logged                                                                                          |
| Security                              | PASS   | a layer that sets a secret is refused; the package opens no connection                                                                                                            |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                                      |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                                    |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                            |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                                  |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                         |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                                 |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                   |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                                |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                           |

- Boundaries: runtime imports `@stackra/contracts`, `@stackra/container`, `@stackra/validation`, `zod` only; React is
  an optional peer; `./react` and `./testing` import `.` through aliases; no app, service or `encore.dev`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; the error class ends in `Error`; no `define` prefix; no Guard/Gate/Provider
  names (the React `ContainerProvider` is container's).
- Secrets: values never logged, serialised or in errors (ADR 0173); tests assert it with a canary.
- No parameter properties and no `#private` fields.

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.`, `./react` and `./testing`, and there is no `./env` entry — Validates: FR-001
- **P-002**: `.` exports `Config`, `Secret`, `env`, `hydrateEnv`, `buildConfig`, `configKey`, `SecretStore`, `ConfigInvalidError` and the types `BuildFacts` and `PublicPart` — Validates: FR-002
- **P-003**: `useConfig` is exported from `./react`, and importing `./testing` adds `.withConfig` and `.withSecrets` to `TestingModuleBuilder` — Validates: FR-003
- **P-004**: `configKey(X)` returns the same derived key for a `Config` class on every call, and the class itself is the injection token — Validates: FR-004
- **P-005**: `buildConfig` merges the layers in the order of ADR 0294 decision 19, validates with the class's generated `X$` schema and returns a frozen object — Validates: FR-005
- **P-006**: a `@Secret` value is resolved through `SecretStore` and never appears in the serialised config, and a layer that sets one is refused — Validates: FR-006
- **P-007**: `package.json` lists the runtime dependencies `@stackra/contracts`, `@stackra/container`, `@stackra/validation` and `zod` and no others — Validates: FR-007
