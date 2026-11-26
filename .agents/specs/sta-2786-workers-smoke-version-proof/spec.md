# Feature Specification: a Worker deploy smokes the new version at 0% and proves which version answered

**Feature Branch**: `figentra/sta-2786-workers-smoke-version-proof`

**Created**: 2026-11-26

**Status**: Tasked

**Tier**: feature

**Approver**: CTO (technical stop; approval pending)

**Linear**: STA-2786

**Clarifications status**: complete

**Input**: The `cloudflare-workers` provider of `@stackra/runway` smoked a new Worker version through the
`Cloudflare-Workers-Version-Overrides` header right after `wrangler versions upload`, while that version was in no
deployment. Cloudflare honours an override only for a version in the current deployment and routes any other request
as usual, so the "0% smoke" reached the version already serving and passed even when the new one was broken. A check
passed on any 2xx, nothing named the version that answered, and a single move to 100% was never smoked. Every caller of
the reusable `runway-cloudflare-workers.yml` workflow had the gap (registry, static, turbo-cache, docs, and any product's
own Worker).

### Sources

- `packages/developer/runway/src/node/drivers/cloudflare-workers-provider.driver.ts` (apply, verify, current, rollback)
- `packages/developer/runway/src/core/constants/cloudflare-workers-settings-schema.constant.ts` (the member schema)
- `packages/developer/runway/src/core/functions/rollback.function.ts` and `errors/runway-deploy-failed.error.ts`
- `packages/developer/runway/stackra.manifest.json` (the published `runway.*` enums)
- `.github/workflows/runway-cloudflare-workers.yml` (the reusable Workers deploy job) and `runway.yaml`
- ADR 0352 decision 3 (providers: plan, apply, verify, rollback; verify after apply); ADR 0536 gate 2 (the version proof, landing with STA-2783 in pull request 1081); ADR 0170 (rollback)
- Cloudflare's documented behaviour of version overrides: honoured only for a version in the current deployment

## Impact

- **Apps touched**: apps/docs (a one-route Worker script answering `/-/version`; `wrangler.jsonc` binds `CF_VERSION_METADATA` and sets `run_worker_first` for that path only)
- **Services touched**: none
- **Packages touched**: packages/developer/runway (the Workers driver, the member schema, core `rollback()`, `RunwayDeployFailedError`, three new exports and one manifest enum)
- **Public contract change**: yes, additive plus one behaviour break. New exports `WORKER_VERSION`, `WorkerVersionProof` and `servedVersionProblem` from `@stackra/runway`; new manifest enum `runway.WorkerVersionProof` (`header`, `route`); new optional member key `versionProof` (default `header`). Behaviour: a Worker member with no smoke check, or a Worker whose answers name no version, now fails every deploy; core `rollback()` now rolls back every target before it throws
- **Cross-service events**: none
- **Tenancy and data**: none; the proof reads one response header or the `/-/version` body, never a tenant's data
- **Secrets**: none added; the smoke keeps reading its bearer from a named variable (ADR 0173)
- **ADR needed**: no new ADR; this implements ADR 0352 decision 3 and ADR 0536 gate 2
- **New dependencies**: none
- **Deploy modes**: SaaS only (Cloudflare Workers); On-prem and Air-gapped do not use this provider
- **Licence tier**: free (MIT, this repo)
- **Docs to update**: packages/developer/runway README and AGENTS, the registry, static and turbo-cache READMEs, apps/docs AGENTS, the changeset (with its Breaking section and two adoption steps)
- **Lane**: full
- **Change risk**: R2 (the production deploy path of every Worker and a breaking change for product repos)

## Acceptance criteria

- **AC-001**: WHEN the `cloudflare-workers` provider applies a new Worker version, THE provider SHALL first deploy it at 0% beside the serving version (`versions deploy <serving>@100 <new>@0`) and smoke it through the version-override header before any traffic moves.
- **AC-002**: IF the 0% smoke fails, THEN THE provider SHALL deploy `<serving>@100` again and move no traffic.
- **AC-003**: WHEN the provider reads a smoke answer, THE provider SHALL accept it only when it names the version under test: the `x-stackra-version` header for a `header` member, or the `/-/version` body and header, read before and after the checks, for a `route` member; another version, none named, or a `/-/version` 404 SHALL fail the step.
- **AC-004**: WHEN the version passes at 0%, THE provider SHALL promote it in the member's rollout steps (10/50/100 for an `api` member in production) with a smoke after every step, the 100% step included, and put the previous version back when a step's smoke fails.
- **AC-005**: IF a Worker member declares no smoke check, THEN THE provider SHALL refuse the deploy before anything ships.
- **AC-006**: THE `targets.cloudflare-workers` member schema SHALL accept `versionProof` with the values `header` (the default) and `route`, and THE runway manifest SHALL publish `runway.WorkerVersionProof` as the string enum `header`, `route`.
- **AC-007**: THE `@stackra/runway` core entry SHALL export `WORKER_VERSION`, `WorkerVersionProof` and `servedVersionProblem`, so another smoke (the box deploy's) can apply the same proof.
- **AC-008**: WHEN `verify` checks a version uploaded before the proof (no header, or a `/-/version` 404), THE provider SHALL report it up only when its answers are 2xx and Cloudflare's own deployment shows the recorded version at 100%, and SHALL report an answer that names another version as down.
- **AC-009**: WHEN core `rollback()` meets a target that verifies down, THE function SHALL roll back every remaining target first and then throw one `RunwayDeployFailedError` naming each down target, its message carrying each down result's detail.
- **AC-010**: WHEN the provider deploys a partial step or the rollback after a failed step, THE provider SHALL use the message `<sha> (<percent>%)` or `<sha> (rolled back to <version>)`, and `current()` SHALL name the commit that serves.
- **AC-011**: WHILE `RUNWAY_DEPLOY_DEADLINE` is set, THE provider SHALL start no traffic move whose holds do not fit before it, SHALL bound a step's smoke to `stepSmokeAttempts` and stop it before the deadline, and SHALL put the previous version back; a failed rollback SHALL be reported with the smoke failure that caused it.
- **AC-012**: THE registry, turbo-cache and edge Workers SHALL send their `CF_VERSION_METADATA` id in `x-stackra-version` on every answer, and THE static and docs Workers SHALL answer `GET /-/version` with `{ "version": "<id>" }` and the same header, leaving every other path unchanged.

## Compatibility and migration

- **Callers of the reusable workflow** (registry, static, turbo-cache, docs in this repo): adopted in this change; `runway.yaml` sets `versionProof: route` for static and docs.
- **Product repositories** must, before upgrading `@stackra/runway`: give every Worker member at least one smoke check, and make every Worker name its version (`version_metadata` binding plus `x-stackra-version`, or a `/-/version` route with `versionProof: route`). Otherwise every Worker deploy fails. The changeset says so first.
- **Version bump**: minor, as `@stackra/*` is a fixed 0.x group; the changeset leads with a Breaking section.
- **Rollback to an older version**: a version uploaded before this change names no version; `verify` accepts it on 2xx answers plus Cloudflare's deployment state (AC-008), so rolling back past this change still works.
- **`RunwayDeployFailedError`**: its constructor signature is unchanged; for a rollback, `target` now lists every down target, comma-separated, and `results` holds every target's result.

## Risks

- Wrangler's acceptance of `<id>@0` and of deployment messages containing a space and parentheses is proved by the fake Cloudflare in the tests only; a real staging Worker deploy must confirm it before production.
- `CF_VERSION_METADATA.id` must equal the uploaded version id; a mismatch fails every step (safe direction).
- A slow-passing step smoke can push a later hold close to the job's timeout: the deadline is checked once after the 0% smoke, not before each later step. The independent review rated it low; it stays open as a follow-up.
- The deadline is taken after the full-history checkout, so the real margin before the 30-minute timeout is 3 minutes minus the checkout time.

## Open questions

None.

## Status history

- 2026-11-26 → Clarified (the cause is Cloudflare's override rule, reproduced by the fake Cloudflare in the tests)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Planned (plan.md) — Approved by Idris (CTO) 2026-11-26
- 2026-11-26 → Tasked (tasks.md; built in the same branch)
