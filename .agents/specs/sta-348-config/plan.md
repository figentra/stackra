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

## Constitution check

- Boundaries: runtime imports `@stackra/contracts`, `@stackra/container`, `@stackra/validation`, `zod` only; React is
  an optional peer; `./react` and `./testing` import `.` through aliases; no app, service or `encore.dev`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; the error class ends in `Error`; no `define` prefix; no Guard/Gate/Provider
  names (the React `ContainerProvider` is container's).
- Secrets: values never logged, serialised or in errors (ADR 0173); tests assert it with a canary.
- No parameter properties and no `#private` fields.
