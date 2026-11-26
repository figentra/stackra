# Implementation Plan: dev sign-in with a dev issuer that deployments refuse

**Spec**: `.agents/specs/sta-2795-dev-sign-in/spec.md` · **Linear**: STA-2795 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2795-dev-sign-in/spec.md`

## Summary

`BearerConfig` gains two optional fields, `devKeys` (`STACKRA_DEV_ISSUER_KEYS`) and `environment`
(`STACKRA_ENVIRONMENT`). A new `verifyCallToken` becomes the one token check behind `CallAuthenticator` and
`BearerTokenGuard`: it first tries the dev issuer under the keys `devIssuerKeys` answers (only in `dev`), then the
configured issuer as before. `createApp` calls `devIssuerKeys` before the generated boot, so dev keys outside `dev` fail
boot. `createDevIssuerKey` and `mintDevToken` make the ES256 pair and tokens; `stackra dev` keeps the pair and a seeded
dev user in `.stackra/dev-issuer.json` and hands a service only the public half; `stackra dev token` prints a token.

## Technical Context

- **Language**: TypeScript (ESM), Web Crypto (ES256, P-256)
- **Members**: `packages/runtime/app`, `packages/developer/cli`, `packages/infrastructure/infra-testbed`
- **Testing**: vitest in `src/**/__tests__/`, on CI; a manual Linux run against a real Encore backend
- **Storage**: one workspace file, `.stackra/dev-issuer.json` (git-ignored, mode 600); nothing server-side
- **Runtime target**: services run by `stackra dev` on a developer machine

## Constitution Check

| Law                                   | Result | Note                                                                       |
| ------------------------------------- | ------ | -------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | cli (developer) depends on app (runtime); no upward import                 |
| Secrets (ADR 0009)                    | PASS   | no Encore secret; the private key never leaves the workspace file          |
| Security                              | PASS   | dev tokens pass only in `dev`; deployed processes with dev keys never boot |
| HTTP and events                       | PASS   | no new route or event; the existing guards' answers are unchanged          |
| Tenancy                               | PASS   | dev tokens carry the same identity claims; tenancy and IAM still enforce   |
| Delegation                            | PASS   | Claude only                                                                |
| Not built yet (ADR 0011)              | N/A    | the local ZITADEL of ADR 0206 decision 4 stays the full-fidelity path      |
| Test placement (ADR 0022)             | PASS   | tests stay in `__tests__/`                                                 |
| Versions and catalogs                 | PASS   | a changeset: app and cli minor, infra-testbed patch                        |
| Deploy modes (ADR 0076)               | PASS   | developer machine only; every deployed mode refuses                        |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                                  |
| Docs and ADRs                         | PASS   | ADR 0206 amendment, the CLI table, the development guide                   |

## Deploy modes

| Mode       | Behaviour                                                                         |
| ---------- | --------------------------------------------------------------------------------- |
| SaaS       | no dev keys, so no dev token passes; a process that carries them fails boot       |
| On-prem    | same as SaaS: `STACKRA_ENVIRONMENT` is never `dev`, so dev keys refuse to boot    |
| Air-gapped | same as SaaS; the dev issuer makes no network call (its issuer is under .invalid) |

## Correctness properties

- **P-001**: a token minted by `mintDevToken` with the workspace key verifies under `verifyCallToken` with that key set
  and `environment: dev`, and its claims are the identity claims given — Validates: AC-001, AC-008
- **P-002**: a dev token signed by another key under the same `kid`, edited after signing, or past its `exp` plus
  leeway never verifies — Validates: AC-002
- **P-003**: a token of the configured issuer verifies with dev keys set and without — Validates: AC-003
- **P-004**: `createApp` rejects with `ConfigInvalidError` for dev keys in `preview`, `staging`, `production` and
  with no environment, and the message never holds a key value — Validates: AC-004
- **P-005**: with no dev keys, a dev token is undefined under `verifyCallToken` — Validates: AC-005
- **P-006**: `devIssuerKeys` refuses non-JSON, an empty or 9-key set, a non-ES256 key, a key without `kid` and a key
  with `d` — Validates: AC-006
- **P-007**: `devIssuerEnv` answers the public set and `STACKRA_ENVIRONMENT=dev` for a service only, the same on every
  run, and nothing for another layout or environment — Validates: AC-007
- **P-008**: the testbed excludes `.stackra/dev-issuer.json` — Validates: AC-009

## Architecture overview

Before: `CallAuthenticator` (the generated Encore auth handler's check) and `BearerTokenGuard` each called
`verifyBearerToken` with the configured issuer, audience and `JsonWebKeys`. After: both call `verifyCallToken(token,
config, keys)`. It asks `devIssuerKeys(config)` for the dev public keys; when it answers keys, it tries
`verifyBearerToken` with `DEV_ISSUER.issuer`, `DEV_ISSUER.audience`, the config's leeway and a key lookup over the dev
set, and returns those claims if they verify. Otherwise it falls through to the configured issuer exactly as before.
`devIssuerKeys` answers undefined when `devKeys` is empty, throws `ConfigInvalidError` when it is set outside
`environment === "dev"` or is not a public ES256 set, and caches per config instance. `createApp` calls it right after
the container is built and before `options.boot`, closing the container and rethrowing on refusal.

On the CLI side, `stackra dev`'s tool command merges `devIssuerEnv(cwd, layout, env)` into a service's environment;
`devIssuerEnv` calls `ensureDevIssuer(root)`, which reads or creates the workspace file. `stackra dev token` reads the
same file and calls `mintDevToken`.

## Components and responsibilities

- `BearerOptions` / `BEARER_CONFIG_SCHEMA` / `BearerConfig`: two new string fields with empty defaults, read from
  `STACKRA_DEV_ISSUER_KEYS` and `STACKRA_ENVIRONMENT`.
- `DEV_ISSUER` (`@stackra/app`): the issuer `https://dev-issuer.stackra.invalid`, audience `stackra-dev`, the variable
  name, the one accepting environment `dev`, and `ES256`.
- `devIssuerKeys` (`@stackra/app/server`): the dev-only rule and key-set validation, in one place.
- `verifyCallToken` (`@stackra/app/server`): the one token check of both guards; dev issuer first, configured issuer
  second.
- `createApp`: the boot-time refusal.
- `createDevIssuerKey`, `mintDevToken` (`@stackra/app`) with `DevIssuerKey`, `DevTokenClaims`: key pair and token mint
  with the provider-neutral identity claims.
- `ensureDevIssuer`, `devIssuerEnv`, `DEV_ISSUER_FILE`, `DevIssuerState` (`@stackra/cli`): the workspace file and what a
  service run gets.
- `DevTokenCommand` (`stackra dev token`): prints a token.
- infra-testbed: the sync exclusion.

## Files and folders

```text
packages/runtime/app/
  stackra.manifest.json
  src/config/bearer.config.ts
  src/config/__tests__/bearer.config.test.ts
  src/core/constants/{bearer-config-schema,dev-issuer}.constant.ts
  src/core/functions/{create-dev-issuer-key,mint-dev-token}.function.ts
  src/core/functions/__tests__/{create-dev-issuer-key,mint-dev-token}.function.test.ts
  src/core/schemas/bearer-options.schema.ts
  src/core/types/{dev-issuer-key,dev-token-claims}.type.ts
  src/core/index.ts
  src/core/__tests__/index.test.ts
  src/server/functions/{create-app,dev-issuer-keys,verify-call-token}.function.ts
  src/server/functions/__tests__/{create-app,dev-issuer-keys,verify-call-token}.function.test.ts
  src/server/services/{bearer-token.guard,call-authenticator.service}.ts
  src/server/services/__tests__/{bearer-token.guard,call-authenticator.service}.test.ts
  src/server/index.ts
  src/server/__tests__/index.test.ts
packages/developer/cli/
  package.json
  stackra.manifest.json
  src/node/commands/dev-token.command.ts
  src/node/commands/__tests__/dev-token.command.test.ts
  src/node/constants/commands.constant.ts
  src/node/dev-issuer/constants/dev-issuer-file.constant.ts
  src/node/dev-issuer/functions/{dev-issuer-env,ensure-dev-issuer}.function.ts
  src/node/dev-issuer/functions/__tests__/{dev-issuer-env,ensure-dev-issuer}.function.test.ts
  src/node/dev-issuer/types/dev-issuer-state.type.ts
  src/node/functions/tool-command.function.ts
  src/node/functions/__tests__/tool-command.function.test.ts
packages/infrastructure/infra-testbed/
  src/agent/testbed-agent.sh
  src/agent/__tests__/testbed-agent.test.ts
  src/core/constants/testbed-defaults.constant.ts
apps/docs/src/docs/
  adr/0206-zitadel-is-the-identity-provider-and-stackra-identity-is-provider-neutral.mdx
  cli.mdx
  cli.ar.mdx
  development.mdx
.changeset/dev-sign-in-dev-issuer.md
```

## Data models and migrations

none. The workspace file `.stackra/dev-issuer.json` holds `{ key: DevIssuerKey, user: { id, name, email } }`; a file
that is not a valid dev sign-in throws naming the file and how to reset it, never a value.

## Contracts

- `BearerOptions.devKeys: string = ""` and `BearerOptions.environment: string = ""`; the app manifest declares
  `STACKRA_DEV_ISSUER_KEYS` and `STACKRA_ENVIRONMENT` as optional config of `app.bearer`.
- `verifyCallToken(token, config: BearerConfig, keys: JsonWebKeys)` answers the verified claims or `undefined`; it
  never throws on an untrusted token, throws when the configured issuer is unreachable, and throws
  `ConfigInvalidError` when dev keys are set outside `dev`.
- `devIssuerKeys(config)` takes `devKeys` and `environment` and answers the dev public keys or `undefined`.
- `DEV_ISSUER`; `createDevIssuerKey()` answers a `DevIssuerKey`; `mintDevToken(privateKey, claims)` takes
  `DevTokenClaims` and answers the compact JWT.
- CLI: `stackra dev token` with `--user`, `--realm` (tenant, customer or platform), `--scope` with `--scope-id`,
  `--role`, `--permission`, `--ttl` (1 to 86,400 seconds) and `--json`; manifest entry `dev:token`.
- Callers of `CallAuthenticator` and `BearerTokenGuard` see no signature change; their answers are unchanged where no
  dev keys are set.

## Error handling

- Dev keys outside `dev`, or a malformed set: `ConfigInvalidError` on `BearerConfig` with the path
  `STACKRA_DEV_ISSUER_KEYS`, raised at boot by `createApp` (the process exits) and, defensively, per call.
- An untrusted or invalid token: `undefined` (the guards answer 401 as before).
- CLI usage errors (`--scope` without `--scope-id`, outside a workspace): `CliUsageError`, exit 2.

## Security and tenancy

The new issuer is accepted only in a process with `STACKRA_ENVIRONMENT=dev` and a public key set; any other process
carrying dev keys never boots, and an unset environment counts as not `dev` (fail closed). The issuer host is under
`.invalid` (RFC 2606), so no discovery or key fetch can ever reach a real provider. The private half never travels (a
key with `d` is refused) and the workspace file is mode 600, git-ignored and excluded from the testbed sync. A dev token
passes through `actorOf`, the scope chain and IAM like a real one; nothing bypasses authorisation (a fresh app without
a bound AccessControl answers 500, fail closed).

## Testing strategy

- AC-001, AC-003: `verify-call-token.function.test.ts` ("verifies a dev token under stackra dev", "still verifies the
  configured issuer's token under stackra dev"); `call-authenticator.service.test.ts`, `bearer-token.guard.test.ts`.
- AC-002: `verify-call-token.function.test.ts` ("refuses a dev token of another dev key, edited after signing, or
  expired"); `mint-dev-token.function.test.ts` (another key, another audience, ttl expiry).
- AC-004: `create-app.function.test.ts` ("dev sign-in keys (STA-2795)": refused in preview, staging, production and with
  no environment; boots under dev and with none); `dev-issuer-keys.function.test.ts` (names the variable only).
- AC-005: `verify-call-token.function.test.ts` ("refuses a dev token where no dev keys are set").
- AC-006: `dev-issuer-keys.function.test.ts` ("refuses a key set that is not one of public ES256 keys, even in dev").
- AC-007: `ensure-dev-issuer.function.test.ts`, `dev-issuer-env.function.test.ts`, `tool-command.function.test.ts`.
- AC-008: `dev-token.command.test.ts`.
- AC-009: `testbed-agent.test.ts`.
- Manual proof (from the PR): on Linux against a real Encore backend, no token gives 401, a token signed by a different
  key under the same `kid` gives 401, and a valid dev token passes authentication.

## Rollout

A changeset: `@stackra/app` minor, `@stackra/cli` minor, `@stackra/infra-testbed` patch. Developers get the dev issuer
on their next `stackra dev`; deployments need nothing and must not set `STACKRA_DEV_ISSUER_KEYS`.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R3: authentication path.

## ADRs

ADR 0206, amendment of 2026-11-26 (the dev issuer, accepted only under `stackra dev`); reads ADR 0170 decision 5 and
ADR 0295 decision 10.

## Docs

The ADR 0206 amendment, `apps/docs/src/docs/cli.mdx` and `cli.ar.mdx` (the `dev token` row), and
`apps/docs/src/docs/development.mdx` (calling a protected route locally).

## Complexity tracking

none
