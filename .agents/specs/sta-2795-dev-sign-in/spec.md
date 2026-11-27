# Feature Specification: dev sign-in with a dev issuer that deployments refuse

**Feature Branch**: `figentra/sta-2795-dev-sign-in`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: the CTO (technical stop; approval pending)

**Linear**: STA-2795

**Clarifications status**: complete

**Input**: A fresh app answered 401 on every protected route. `CallAuthenticator` and `BearerTokenGuard` accepted only
a token of the configured OIDC issuer, verified under its JWKS (ADR 0206 decision 8), or an API key, and nothing in core
or the starter could mint one locally, so a developer could not make an authenticated call (found in the STA-2794
create proof). STA-2795's "Done when": a documented, dev-only way to call protected routes that a deployed environment
refuses, with a test; ZITADEL and OIDC stay the only path outside local development. Was stackra#1104.

### Sources

- `packages/runtime/app/src/server/services/call-authenticator.service.ts` and
  `packages/runtime/app/src/server/services/bearer-token.guard.ts` (the two callers of the token check)
- `packages/runtime/app/src/core/functions/verify-bearer-token.function.ts` (the decision-8 checks, unchanged)
- `packages/runtime/app/src/core/schemas/bearer-options.schema.ts` and `src/config/bearer.config.ts` (`BearerConfig`)
- `packages/foundation/config/src/core/functions/read-environment.function.ts` (`readEnvironment`, the one environment
  reader of STA-2844, on main since stackra#1166) and the CTO's verdict of 2026-11-26 on stackra#1104: the dev-token
  gate must not read the free-string `app.bearer.environment`; it uses the reader
- `packages/developer/cli/src/node/functions/tool-command.function.ts` (how `stackra dev` runs a member)
- ADR 0206 (decision 8 and its amendment of 2026-11-26), ADR 0170 (decision 5: `dev` is a developer machine only),
  ADR 0295 (decision 10: a bad environment fails boot)
- STA-2795 (the issue and its "Done when"), STA-2794 (the create proof that found it)

## Impact

- **Apps touched**: apps/docs (the ADR 0206 amendment, the CLI table in English and Arabic, the development guide)
- **Services touched**: none
- **Packages touched**: app (`@stackra/app`: the `BearerConfig` `devKeys` field, `verifyCallToken`, `devIssuerKeys`,
  `DEV_ISSUER`, `createDevIssuerKey`, `mintDevToken`, two types, the internal `runningEnvironment` over the one reader,
  the boot check in `createApp`, manifest); cli (`@stackra/cli`:
  `stackra dev token`, `ensureDevIssuer`, `devIssuerEnv`, the `stackra dev` run of a service, manifest, a workspace
  dependency on `@stackra/app`); infra-testbed (the sync leaves out `.stackra/dev-issuer.json`)
- **Public contract change**: `BearerOptions` gains `devKeys` (`STACKRA_DEV_ISSUER_KEYS`), optional with an empty
  default, and no environment field (the running environment is the one reader's answer, STA-2844); new exports
  `DEV_ISSUER` (its `environment` is `StackraEnvironment.Dev`), `createDevIssuerKey`, `mintDevToken`, `DevIssuerKey`,
  `DevTokenClaims` (`@stackra/app`) and `devIssuerKeys(config, environment)`,
  `verifyCallToken(token, config, keys, environment)` (`@stackra/app/server`), whose `environment` is a
  `StackraEnvironment`; the CLI manifest gains the `dev:token` command; the app manifest declares
  `STACKRA_DEV_ISSUER_KEYS` only
- **Cross-service events**: none
- **Tenancy and data**: none stored; a dev token carries the same provider-neutral identity claims (realm, scope path,
  memberships, permissions) a ZITADEL token does, so tenancy and IAM see it as a real caller and keep enforcing
- **Security and privacy**: a new accepted token issuer on the authentication path, bounded to a running environment
  of `dev` as the one environment reader answers it from the runtime (never a configuration value, so a values layer
  or a host override cannot turn it on); a deployed process that carries dev keys fails boot; no personal data (the
  seeded dev user is generated)
- **Secrets**: no Encore secret added or read; the dev private key lives only in the workspace's git-ignored
  `.stackra/dev-issuer.json` (mode 600) and never travels; services receive the public key set only
- **ADR needed**: amendment of ADR 0206, dated 2026-11-26 (in this branch)
- **New dependencies**: none external; `@stackra/cli` takes a workspace dependency on `@stackra/app`
- **Deploy modes**: dev sign-in exists on a developer machine only; SaaS, on-prem and air-gapped deployments behave as
  before and refuse to boot with dev keys
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: ADR 0206 amendment (decision 3 reads the one reader), apps/docs cli.mdx and cli.ar.mdx,
  apps/docs development.mdx, changeset
- **Lane**: full
- **Change risk**: R3 (authentication path: a new accepted issuer, bounded to dev by a boot-time refusal)

## Acceptance criteria

- **AC-001**: WHEN a `DEV_ISSUER` token arrives under `stackra dev` THE `verifyCallToken` function SHALL accept it
  and answer its claims, if one of the public keys in `STACKRA_DEV_ISSUER_KEYS` signed it and the running environment
  its caller passes from the one reader is `dev`.
- **AC-002**: THE `verifyCallToken` function SHALL hold a dev token to every decision-8 check a real token gets
  (algorithm, signature, `iss`, `aud`, `exp`, `nbf`, leeway), so a token signed by another key under the same `kid`,
  edited after signing, or expired is refused.
- **AC-003**: THE `verifyCallToken` function SHALL keep verifying the configured issuer's tokens under the bound
  `JsonWebKeys`, with or without dev keys set.
- **AC-004**: IF dev keys are set outside a `dev` running environment THEN THE `createApp` function SHALL fail boot
  with `ConfigInvalidError` naming `STACKRA_DEV_ISSUER_KEYS`, never a value, before the generated boot runs. The running
  environment is the one reader's answer: a deployed platform that set no variable counts as its deployed environment,
  and a variable the reader refuses fails boot too.
- **AC-005**: IF no dev keys are set THEN THE `verifyCallToken` function SHALL check a dev token only against the
  configured issuer, which refuses it.
- **AC-006**: IF the dev key set is malformed THEN THE `devIssuerKeys` function SHALL refuse it with
  `ConfigInvalidError`, even in `dev`; malformed means not JSON, not 1 to 8 keys, or a key that is not a public ES256
  key with a `kid`, or that holds a private member.
- **AC-007**: WHEN `stackra dev` runs a service THE CLI SHALL create `.stackra/dev-issuer.json` (an ES256 pair and a
  seeded `usr_` dev user, mode 600) on first use and hand the service only the public key set with
  `STACKRA_ENVIRONMENT=dev`; an app, package, worker, or a service run under another environment gets neither.
- **AC-008**: WHEN a developer runs `stackra dev token` THE CLI SHALL print only a token for the seeded dev user (or the
  `--user`, `--realm`, `--scope` with `--scope-id`, `--role`, `--permission` and `--ttl` given), never the private key,
  and SHALL refuse `--scope` without `--scope-id` and a run outside a workspace as usage errors.
- **AC-009**: THE testbed sync SHALL leave `.stackra/dev-issuer.json` on the workstation.
- **AC-010**: IF a configuration value names the environment THEN THE `BearerTokenGuard` service SHALL ignore it
  and judge dev tokens by the one reader's answer, refusing dev keys with `ConfigInvalidError` on a deployed platform.
  A configuration value is a host override or values layer setting `environment = "dev"` on `BearerConfig`, or
  `STACKRA_ENVIRONMENT` in the configuration's own layers.

## Compatibility and migration

- Additive. `devKeys` defaults to empty, so every existing deployment reads no dev keys and boots and verifies exactly
  as before; `CallAuthenticator` and `BearerTokenGuard` keep their constructors and answers.
- A deployment must not set `STACKRA_DEV_ISSUER_KEYS`; if it does, it now fails boot by design (fail closed).
  `BearerConfig` reads no `STACKRA_ENVIRONMENT`: the gate asks `readEnvironment` (STA-2844), which every other
  environment check shares, so nothing changes meaning.
- Consumers that called `verifyBearerToken` directly are untouched; `verifyCallToken` is the new single path the two
  guards share (ADR 0209 amendment of 2026-11-07, point 5: one authentication path).
- No migration. Developers get the dev issuer on their next `stackra dev`.

## Risks

- A dev token accepted in a deployed environment. Mitigated four ways: the boot refusal wherever the one reader does
  not answer `dev` (a deployed platform derives its environment even with no variable), the per-call check against the
  same reader, a `.invalid` issuer no real provider can hold, and the real issuer refusing a dev token's `iss`, `aud`
  and `kid`. A configuration value can no longer take part (the CTO's verdict on stackra#1104).
- A process with no platform report and no `STACKRA_ENVIRONMENT` reads as `dev` (the reader's rule for developer tools
  and unit tests, STA-2844); it accepts dev tokens only if it also carries `STACKRA_DEV_ISSUER_KEYS`, which only
  `stackra dev` sets. Every generated Encore service reports its platform before `createApp`.
- The private key leaking. It stays in a git-ignored, mode-600 file; the variable refuses a key with `d`; the testbed
  sync excludes the file.
- Known follow-ups (from the review, not in this change): a fresh app's protected routes then answer 500 "AccessControl
  is not bound" (fails closed) until `stackra dev` binds an AccessControl driver; two parallel first runs of
  `stackra dev` can race creating the dev issuer file. STA-2795 stays open for the first.

## Open questions

None.

## Status history

- 2026-11-26 → Clarified (STA-2795's "Done when"; the STA-2794 create proof)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md; built in the same branch)
- 2026-11-27 → Implementing (rebased onto the one environment reader, STA-2844: the dev-token gate reads
  `readEnvironment`, never `app.bearer.environment`, per the CTO's verdict of 2026-11-26; awaiting the CTO's approval)
