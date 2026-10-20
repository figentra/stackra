# Feature Specification: `@stackra/config` — typed package configuration with publish and override

**Feature Branch**: `figentra/sta-77-config-spec`

**Created**: 2026-10-20

**Status**: Draft <!-- Draft → Clarified → Planned → Ready → Implementing → Verified, or Abandoned / Superseded; spec-gate ci checks the artifacts each stage needs -->

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

<!-- Folder: .agents/specs/sta-77-config/, named by the Linear key below (ADR 0120 D1). -->

**Linear**: STA-77

**Linear project**: Foundation kernel

**Clarifications status**: pending <!-- /speckit.clarify sets this to "complete" when nothing is open -->

**Input**: User description: "Port `@figentra-os/config` to `packages/foundation/config` as `@stackra/config` (port + adapt, roadmap W1.2). Keep namespaced, typed, validated configuration with the environment passed in and secrets boxed; add Laravel-style package defaults in `config/<pkg>.config.ts`, publish into a host and override per host; config holds secret references only (FW3)."

## Impact _(mandatory, answer every line before /speckit.clarify completes)_

- **Apps touched**: none (apps adopt the package later; the console and mobile entries stay hello-world in this change)
- **Services touched**: none
- **Packages touched**: packages/foundation/config (new). Reads `@stackra/container` (STA-76) and `@stackra/support` (STA-75); `@stackra/contracts` (STA-74) for STK diagnostics and error kinds
- **Cross-service events**: none. The in-process `config.loaded` and `config.invalid` notifications of the source are not integration events and are not wired in this change (see FR-024)
- **Tenancy and data**: none. Deploy-time configuration only; tenant- and scope-specific values are settings ([0108](/adr/0108-scoped-settings)), tenant credentials are connections ([0107](/adr/0107-connections-store-and-three-key-homes) home B)
- **Secrets**: no secret values. The package boxes and redacts values handed to it and declares secret references by name (e.g. `STRIPE_WEBHOOK_SECRET` as a name only); how a reference becomes an Encore `secret()` is FW3 / spike STA-138 and is pending (see Open items)
- **ADR needed**: no new ADR for the port; [0044](/adr/0044-laravel-style-package-config) needs its TODOs (publish path, merge depth, owning package) filled by amendment once C42 is answered, and the package design record ([0018](/adr/0018-framework-design-record)) is written in the plan stage
- **New dependencies**: none at runtime. `vite` stays an optional peer through the existing catalog entry; Standard Schema is a vendored type, not a dependency
- **Deploy modes**: same in all three. The package makes no outbound call and reads no ambient environment; the host passes the environment in. SaaS: values come from the Encore runtime secret store and process environment; on-prem: from the customer's environment or Kubernetes secrets through the same `EnvSource`; air-gapped: identical, nothing calls home ([0076](/adr/0076-every-package-runs-saas-on-prem-and-air-gapped))
- **Lane**: full (port + adapt, new package; roadmap W1.2 row)
- **Change risk**: R3 — a new package with a public contract is R2, and the package handles secret values (boxing, redaction, references), which [0120](/adr/0120-sdlc-spec-location-lanes-and-change-risk) D16 lists under R3. Blocking security review applies

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A package author declares typed, validated defaults (Priority: P1)

A package author ships `packages/<category>/<pkg>/config/<pkg>.config.ts`, outside `src/`, that registers one namespace with a typed factory over a passed-in environment, a schema, and key-by-key documentation. The package's module takes its options from that namespace through `fromConfig`.

**Why this priority**: every later package in Phase 1 and beyond (logger, cache, filesystem, i18n) takes its options this way ([0044](/adr/0044-laravel-style-package-config) D1, D5); nothing else in this spec is useful without it.

**Independent Test**: load a sample namespace with `ConfigModule.forRoot({ env: memoryEnv({...}), load: [...] })` in a container and inject it by `KEY`; a bad value fails bootstrap with a coded error naming the variable, never the value.

**Acceptance Scenarios**:

1. **Given** a namespace `cache` with `ttl` read from `CACHE_TTL` with fallback 60, **When** the container boots with no `CACHE_TTL`, **Then** a provider injecting `cacheConfig.KEY` receives `{ ttl: 60, ... }`, frozen.
2. **Given** `CACHE_TTL=abc` and a number accessor, **When** the container boots, **Then** bootstrap fails with an STK-coded `invalid_env` error whose message names `CACHE_TTL` and `cache`, and contains no value.
3. **Given** a schema that rejects the factory's value and `validate: "strict"`, **When** the container boots, **Then** bootstrap fails with `invalid_namespace` listing every issue by path.
4. **Given** two namespaces named `cache` in one load list, **When** `forRoot` runs, **Then** it throws `duplicate_namespace`.

---

### User Story 2 - A host publishes a package's defaults and overrides them (Priority: P1)

An app or service owner copies a package's default config file into the host (Laravel `vendor:publish` style), edits it, and the host's copy wins at start-up. A host that publishes nothing runs on the package defaults.

**Why this priority**: publish and override is the "adapt" in this row ([0084](/adr/0084-figentra-os-package-port-plan) foundation/config; decisions Round 8 F4).

**Independent Test**: publish a fixture package's config into a temporary host directory, change one key, boot, and see the override merged over the defaults and validated.

**Acceptance Scenarios**:

1. **Given** a host with no published copy, **When** it loads the package, **Then** it gets the package defaults ([0044](/adr/0044-laravel-style-package-config) D2).
2. **Given** a published copy that changes one nested key, **When** the host boots, **Then** that key is overridden, the rest come from defaults, and the merged value passes the package's schema ([0044](/adr/0044-laravel-style-package-config) D3).
3. **Given** the target file already exists, **When** publish runs without force, **Then** it refuses and leaves the host's file untouched.
4. **Given** a package whose default changed since the host published it, **When** the host checks its published copies, **Then** it is told which keys differ ([0044](/adr/0044-laravel-style-package-config) consequences).

---

### User Story 3 - Secrets are referenced, boxed and never leaked (Priority: P1)

A config declares a secret by reference (name only). At runtime the host hands the resolved value in through its environment source; the value is a `Secret` box whose only accessor is `reveal()`, and every serialisation, snapshot, error and log shows `[redacted]`.

**Why this priority**: [0009](/adr/0009-secrets-two-mechanisms) D1 (names in git, values in the vault) and [0107](/adr/0107-connections-store-and-three-key-homes) home A ("`@stackra/config` holds only secret references"); this is the R3 surface.

**Independent Test**: property tests plant a random secret and assert it never appears in `String`, template literals, `JSON.stringify`, `util.inspect`, spread, `structuredClone`, `snapshot()`, error messages or schema issue text.

**Acceptance Scenarios**:

1. **Given** `env.secret("STRIPE_WEBHOOK_SECRET")` and the variable absent, **When** the namespace loads, **Then** it fails with `missing_env`; there is never a fallback for a secret.
2. **Given** a loaded secret, **When** any code serialises the config, **Then** the output carries `[redacted]` and not the value.
3. **Given** a package default file containing a literal secret value, **When** the repository is validated, **Then** the check fails (gitleaks plus the planned config check).

---

### User Story 4 - Each host feeds the environment its own way (Priority: P2)

A Node or generated Encore service passes `processEnv(process.env)`, a Vite app passes `viteEnv(import.meta.env)` (prefix-filtered) and its build fails early through `configPlugin`, a test passes `memoryEnv`.

**Why this priority**: the package must run unchanged in every host the container runs in ([0042](/adr/0042-di-first-with-one-container-per-service)); the hosts exist in the source and port with it.

**Independent Test**: the same namespace evaluates identically from `processEnv`, `viteEnv` and `memoryEnv` given equal key/value maps.

**Acceptance Scenarios**:

1. **Given** `viteEnv(import.meta.env)` with default prefix `VITE_`, **When** a namespace reads an unprefixed key, **Then** it is absent (only prefixed keys plus `MODE`, `DEV`, `PROD`, `BASE_URL` are visible).
2. **Given** `configPlugin({ namespaces })` and a missing variable, **When** `vite build` runs, **Then** the build fails listing variable names only.

---

### User Story 5 - Tests configure modules without an environment (Priority: P3)

A test author uses `createTestConfig`, `expectConfig` and `expectConsumesConfig` from `./testing` to give a module fixed values and prove it consumes a namespace.

**Why this priority**: needed by every consumer's tests, but only after the core exists.

**Independent Test**: `expectConsumesConfig(SampleModule, sampleConfig, { token })` passes for a correct consumer and fails with `consumer_mismatch` for a wrong one.

**Acceptance Scenarios**:

1. **Given** `createTestConfig({ cache: { ttl: 1 } })`, **When** a module injects `cacheConfig.KEY`, **Then** it gets `{ ttl: 1 }` without factories or schemas running.

### Edge Cases

- A blank value (`FOO=` or only spaces) counts as absent for every accessor.
- A namespace name with `.` or starting with a non-letter is rejected by `registerAs`.
- `ConfigService.get` on a path deeper than four segments, or a path no namespace has, throws `unknown_path`; `has()` never throws.
- Lists, `Secret` boxes and class instances are leaves: `get` never walks into them, and a merge never merges into them.
- The service is used after `container.close()`: it throws `disposed`.
- A published host copy whose package is no longer installed, or whose namespace name differs from the package's: refused with a coded error naming the file.
- `validate: "warn"`: the unvalidated value is kept and the report goes to the logger port; a missing or unparsable variable still fails.
- A schema issue message that echoes the input value: the message is scrubbed of every secret and sensitive value before it reaches an error, event or log.

## Requirements _(mandatory)_

Requirements use EARS forms (ubiquitous, event-driven "When", state-driven "While", unwanted "If … then", optional "Where").

### Functional Requirements

**Port conventions**

- **FR-001**: The package shall be published as `@stackra/config` from `packages/foundation/config`, with every `@figentra-os/*` name and Figentra wording stripped ([0083](/adr/0083-npm-scopes-and-cli-names); decisions X5) and relicensed to MIT ([0084](/adr/0084-figentra-os-package-port-plan)).
- **FR-002**: The package shall meet the [0084](/adr/0084-figentra-os-package-port-plan) decision 1 conventions: a file-contract docblock on every file and a docblock on every export ([0007](/adr/0007-source-documentation-standard)), one export per file, `#` subpath imports, no `any`, non-null assertions or TypeScript `enum` (the source's frozen `as const` objects stay), no `Reflect` metadata, no `encore.dev` import.
- **FR-003**: Every diagnostic and error code the package raises shall carry an `STK` prefix from the shared diagnostics catalogue in `@stackra/contracts`, keeping the source's closed code set (`duplicate_namespace`, `invalid_namespace`, `missing_env`, `invalid_env`, `unknown_path`, `disposed`, `consumer_mismatch`; source `src/contracts/enums/config-error-codes.enum.ts`) as its sub-codes (decisions X3; [0084](/adr/0084-figentra-os-package-port-plan) decision 1).
- **FR-004**: The package entries shall follow the package layout [NEEDS CLARIFICATION: FW1 — recommended: a) entries first; `config/` and `resources/` outside `src`]. Under the recommended layout the entries are `.` (core), `./contracts`, `./node`, `./vite` and `./testing`, ported from the source's entries of the same names.

**Namespaces and loading (ported surface)**

- **FR-005**: The package shall provide `registerAs(name, factory, { schema?, sensitive?, description? })` returning a frozen namespace `{ name, KEY, factory, schema?, sensitive?, description? }` whose `KEY` is interned per name, and whose factory does not run at import (source README §1).
- **FR-006**: The package shall provide the `Env` accessors `string`, `number`, `boolean`, `list`, `json`, `secret`, `require` and `has` with the source's parsing, absence and error semantics, and shall record which variable fed which key (source README §1).
- **FR-007**: When `ConfigModule.forRoot({ env, load, validate, cache, logger })` is imported, the module shall be global, run each namespace factory once per container, validate it against its Standard Schema, freeze it, and provide it under its `KEY`, plus `CONFIG`, `CONFIG_ENV`, `CONFIG_OPTIONS`, `CONFIG_NAMESPACES` and `CONFIG_SOURCES` ([0044](/adr/0044-laravel-style-package-config) D5; [0042](/adr/0042-di-first-with-one-container-per-service)).
- **FR-008**: If a namespace fails its schema while `validate` is `"strict"` (the default), then bootstrap shall fail with `invalid_namespace` listing every issue by path and source variable.
- **FR-009**: While `validate` is `"warn"`, the module shall keep the unvalidated value and report the issues to the configured logger port, else the `CONFIG_LOGGER` token, else nowhere.
- **FR-010**: The package shall provide a typed `ConfigService` (`get`, `namespace`, `has`, `snapshot`) over a `ConfigMap` that hosts augment, with paths at most four segments deep (source README §3).
- **FR-011**: The package shall provide `fromConfig(ns, map?)` and `fromConfigs([a, b], map)` returning `{ useFactory, inject }` for any package's `forRootAsync` (source README §4).
- **FR-012**: The package shall read no ambient environment (`process.env`, `import.meta.env`) and load no `.env` file; the host passes an `EnvSource` (`processEnv`, `viteEnv`, `memoryEnv`, or any `{ name, get, keys }`) ([0009](/adr/0009-secrets-two-mechanisms) D4; source README).
- **FR-013**: Where the host is Vite, `configPlugin({ namespaces, validate?, mode?, prefix?, env? })` shall evaluate every namespace at `buildStart` and fail (or warn) the build listing variable names only; `vite` stays an optional peer.

**Package defaults, publish and override (adapt)**

- **FR-014**: Where a package has configurable options, it shall ship its defaults in `config/<pkg>.config.ts` outside `src/`, exported through `./config`; a package with nothing configurable shall have no `config/` directory ([0044](/adr/0044-laravel-style-package-config) D1, D6; [0025](/adr/0025-packages-publish-to-private-registry); decisions package layout).
- **FR-015**: When a host publishes a package's config, the package's publish primitive shall copy the package default file into the host's config folder [NEEDS CLARIFICATION: C42 publish path — recommended: `config/<pkg>.config.ts` at the member root, mirroring FW1 a], and shall refuse to overwrite an existing file unless forced.
- **FR-016**: When a host boots with a published copy, the loader shall merge the host's values over the package defaults and validate the result against the package's schema at start-up [NEEDS CLARIFICATION: C42 merge depth — recommended: deep merge of plain objects; arrays, `Secret` boxes and class instances replace] ([0044](/adr/0044-laravel-style-package-config) D2, D3).
- **FR-017**: The publish command shall be owned by one package [NEEDS CLARIFICATION: C42 owning package — recommended: `@stackra/config` ships the publish and diff primitives as library functions; `@stackra/cli` (W3.x) wraps them as `stackra config:publish`].
- **FR-018**: When a host's published copy differs from the installed package default, the package shall be able to report the differing keys by path, never by value, so upgrades can tell products a copied default changed ([0044](/adr/0044-laravel-style-package-config) consequences).

**Secrets**

- **FR-019**: The package shall box every value read by `env.secret(key)` in a `Secret` whose only accessor is `reveal()`; `String`, template literals, `JSON.stringify`, `util.inspect`, spread and `structuredClone` shall show `[redacted]` or nothing (source README §6).
- **FR-020**: If `env.secret(key)` finds the variable absent or blank, then loading shall fail with `missing_env`; a secret never has a fallback.
- **FR-021**: The package shall redact every `Secret` and every path listed in `sensitive` in `snapshot()`, errors, devtools output and log reports, and shall scrub schema messages of those values before they leave the loader.
- **FR-022**: A config file shall declare a secret by reference (its name and purpose) only, never by value ([0009](/adr/0009-secrets-two-mechanisms) D1; [0107](/adr/0107-connections-store-and-three-key-homes) home A; [0044](/adr/0044-laravel-style-package-config) D4). How the generator turns a reference into a runtime secret declaration is [NEEDS CLARIFICATION: FW3 — recommended: a) config declares secret refs; gen collects them and emits one Encore `secret()` per ref; the container injects resolved values; confirmed by spike STA-138]. This package exposes the declared references in a form `stackra gen` can read through container scan and plan without instantiating ([0090](/adr/0090-codegen-discovery-by-root-module)).
- **FR-023**: The package shall not hold tenant credentials or per-tenant values; those are connections ([0107](/adr/0107-connections-store-and-three-key-homes) home B) and scoped settings ([0108](/adr/0108-scoped-settings)).

**Dependencies and adaptation**

- **FR-024**: The package shall depend only on `@stackra/container`, `@stackra/support` and `@stackra/contracts` at runtime. The source's hard dependency on `@figentra-os/events` shall be removed, because events ports after config (roadmap W1.3); the `config.loaded` and `config.invalid` notifications shall go to the logger port in this change, and their event wiring is a follow-up for the events spec (STA-80).
- **FR-025**: The source's `./devtools` entry (`registerConfigDevtools`) shall not ship in this change, because `@stackra/devtools-kit` ports in W1.3 (STA-84); its tab is added there only if needed ([0084](/adr/0084-figentra-os-package-port-plan) decision 1, "tabs only where a package needs one").
- **FR-026**: The `./node` entry shall port `processEnv` and `resolveAppPaths` (source `src/node/paths`), with the config path default changed to match the host publish path chosen under FR-015.

**Testing**

- **FR-027**: The `./testing` entry shall port `memoryEnv`, `createTestConfig`, `expectConfig` and `expectConsumesConfig`; failures name paths, never values.
- **FR-028**: Tests shall sit in `__tests__/` beside their subject ([0022](/adr/0022-tests-live-in-tests-folders)) and include the source's property tests (parsers round-trip, `get(path)` agrees with injection, a planted secret never leaks) plus new tests for publish, merge and diff, at the coverage floor [NEEDS CLARIFICATION: TS3 — recommended: a) 80% lines and functions, 70% branches for this package].
- **FR-029**: `pnpm verify` and every test shall pass with zero secrets available ([0009](/adr/0009-secrets-two-mechanisms) D7).

### Key Entities

- **ConfigNamespace**: a named, frozen declaration of one topic's configuration: name, injection `KEY`, factory over `Env`, optional schema, sensitive paths, description.
- **Env / EnvSource**: the host-provided view of the environment; typed accessors over a `{ name, get, keys }` source.
- **Secret**: an opaque box around a secret value; reveals only through `reveal()`.
- **Secret reference**: the name and purpose of a secret a config needs, never its value; what gen reads (FW3).
- **Package default file**: `config/<pkg>.config.ts` in a package, exported as `./config`.
- **Published copy**: a host's editable copy of a package default file; merged over the default at start-up.
- **ConfigService**: typed dotted-path reader over all loaded namespaces, with redacted `snapshot()`.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A sample package can declare defaults, and a sample host can publish, override one key and boot, in one test file each, with no environment variables and no secrets.
- **SC-002**: Property tests plant 1,000 random secret values and none appears in any serialisation, snapshot, error message or logger report.
- **SC-003**: Every error the package raises carries an `STK` code; a test enumerates the code set and fails on one without the prefix.
- **SC-004**: The package has zero runtime dependencies outside `@stackra/container`, `@stackra/support` and `@stackra/contracts`, checked by `pnpm validate` and knip.
- **SC-005**: Coverage meets the agreed floor (FR-028), and `pnpm verify` is green on the merge commit.
- **SC-006**: The same namespace evaluates to an equal frozen value from `processEnv`, `viteEnv` and `memoryEnv` given the same map, in all three deploy modes, with no outbound network call.

## Assumptions

- `@stackra/container` (STA-76), `@stackra/support` (STA-75) and `@stackra/contracts` (STA-74) land first, per the roadmap's W1.1 → W1.2 order.
- The STK diagnostics catalogue and error kinds in `@stackra/contracts` (FW7 a, assumed by the roadmap) are the shape config's codes plug into.
- Config is deploy-time and per environment; anything a tenant or user changes at runtime is a setting ([0108](/adr/0108-scoped-settings)).
- ADR 0044 is Proposed; Phase 0 item OR1 (STA-134) is expected to accept it before this spec is Clarified.
- The `stackra` CLI does not exist yet; the publish primitive is testable as a library function until it does.

## Glossary

- **Namespace**: one topic of configuration, registered once with `registerAs`, injected by its `KEY`.
- **Publish**: copying a package's default config file into a host so the host can edit it (Laravel `vendor:publish`).
- **Override**: a host's published value that wins over the package default after merge.
- **Host**: the app or service whose container loads the configuration.
- **EnvSource**: an object with `name`, `get(key)` and `keys()` that the host passes in; the package never reads the environment itself.
- **Secret box**: the `Secret` wrapper that redacts its value everywhere except `reveal()`.
- **Secret reference**: a secret's name and purpose in a config file; the value lives in the runtime secret store ([0009](/adr/0009-secrets-two-mechanisms)).
- **STK**: the prefix of every Stackra diagnostic code (decisions X3).
- **Strict / warn**: validation modes; strict fails bootstrap on a schema issue, warn reports and continues.

## Open items

- [NEEDS CLARIFICATION: FW1 — recommended: a) entries first; `config/` and `resources/` outside `src`; supersedes 0004] (FR-004)
- [NEEDS CLARIFICATION: FW3 — recommended: a) config declares secret refs; gen emits one Encore `secret()` per ref; container injects resolved values; spike STA-138] (FR-022)
- [NEEDS CLARIFICATION: C42 publish path — recommended: `config/<pkg>.config.ts` at the host member root] (FR-015)
- [NEEDS CLARIFICATION: C42 merge depth — recommended: deep merge of plain objects; arrays, secrets and class instances replace] (FR-016)
- [NEEDS CLARIFICATION: C42 owning package — recommended: primitives in `@stackra/config`, command in `@stackra/cli`] (FR-017)
- [NEEDS CLARIFICATION: TS3 — recommended: a) 80/70 for this package] (FR-028)
