<!-- Purpose: what @figentra/worker-env-sync is, its API, settings, layout, the deploy that is not wired yet and the owner runbook. Boundary: member documentation only. Runtime: docs. Governing contract: ADR 0173 (amendment of 2026-11-04, decision 6), ADR 0284, ADR 0519. -->

# @figentra/worker-env-sync

> **Retired (ADR 0525, STA-2146).** The Worker answers Infisical's webhook, and Infisical is leaving. Its deploy
> (`deploy-env-sync.yml`), core's `runway-env-sync.yml` and the root runway's `env-sync` member are gone; runtime values
> now sync at deploy from each product's sops scope. Deleting the deployed Worker is on the P6 owner checklist. The
> text below describes it as it was.

Stackra's environment-sync webhook: one Cloudflare Worker (`stackra-env-sync`) that takes Infisical's webhook when a
value changes and dispatches the `env-sync` workflow of the repository that owns the changed project
([ADR 0173](../../apps/docs/src/docs/adr/0173-secrets-infisical-is-the-source-of-production-secrets.mdx), amendment of
2026-11-04, decision 6). That workflow calls core's reusable `.github/workflows/runway-env-sync.yml`, which checks the
values and runs `runway env sync <env>`. The Worker never sees a value: Infisical's payload carries metadata only.

## API

| Method and path   | Answer                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `POST /infisical` | `202 { dispatched: { repository, environment, path } }` once GitHub accepted the dispatch      |
| anything else     | `404` off the route, `405` (`allow: POST`) for another method on it                            |

In order, the Worker:

1. Checks `x-infisical-signature` (`t=<timestamp>;<hex>`): HMAC-SHA256 of the raw JSON body with the Worker secret
   `INFISICAL_WEBHOOK_SECRET`, compared in constant time, as Infisical signs it. `t` must equal the signed body's
   `timestamp` (milliseconds), which must be within five minutes. A missing secret or a bad, stale or missing
   signature answers 401.
2. Parses the body and refuses (400) any payload holding a `value`, `secretValue` or `secrets` key at any depth, then
   acknowledges (200, no dispatch) any event other than `secrets.modified`.
3. Reads `project.workspaceId`, `project.environment` and `project.secretPath` (400 when one is missing).
4. Maps the project to a repository through `ENV_SYNC_ROUTES` (404 when unknown) and the Infisical slug to the Runway
   environment: `dev` to `dev`, `staging` to `staging`, `prod` to `production` (400 for anything else).
5. Dispatches `POST /repos/<owner>/<repo>/actions/workflows/env-sync.yml/dispatches` with
   `{ ref: "main", inputs: { environment, path } }` and a fresh installation token of the stackra-bot GitHub App
   (`installationToken`): an RS256 App JWT finds the App's installation on the repository, which mints a token for that
   repository alone with `actions: write`. GitHub's 204 answers 202; anything else answers 502 with GitHub's status
   (`app_not_installed`, `token_refused` or `dispatch_failed`).

`GET /readyz` answers 200 `{ "ready": true }` when the three secrets and `ENV_SYNC_ROUTES` are there and the App key
reads as a PEM private key, and 503 `not_ready` naming the ones that are not (names only); the deploy smoke-checks it.

Errors use `{ "error": { "code", "message" } }`. 503 means a setting is missing (the App id, its key, or the routes). No
header, token or body is logged.

## Settings

| Variable                            | Default | Meaning                                                                          |
| ----------------------------------- | ------- | -------------------------------------------------------------------------------- |
| `ENV_SYNC_ROUTES`                   | `{}`    | JSON object, Infisical project id to `owner/repo`; a `vars` entry in wrangler    |
| `INFISICAL_WEBHOOK_SECRET` (secret) | none    | the webhook's signing key; unset means every request gets 401                    |
| `STACKRA_BOT_APP_ID` (secret)       | none    | the stackra-bot GitHub App's id; unset is 503                                     |
| `STACKRA_BOT_PRIVATE_KEY` (secret)  | none    | the App's private key (PEM, PKCS#1 or PKCS#8); unset or unreadable is 503        |

`INFISICAL_WEBHOOK_SECRET` lives in Infisical `ci-production` `prod` `/ci/env-sync`. The App id and
key are the stackra-bot App's one stored copy in `ci-production` `prod` `/ci/release` (SECRETS Q17, STA-2133); the
deploy job reads them by name with the production identity and sets them as Worker secret bindings, a synced runtime
copy (ADR 0371). The deploy workflow names all three with `secret-name:`, as `deploy-registry.yml` does with
`REGISTRY_SIGNING_KEY`. Core has no runtime project (ADR 0512), so they are not in `runway.yaml` `secrets:`, where
`runway env check` would find no home for them.

## Layout

| Path                     | Holds                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `wrangler.jsonc`         | Worker name, entry and the routes setting (code facts only, ADR 0519)                 |
| `runway.yaml`            | the member's runway (the root target is `targets.cloudflare-workers.members.env-sync`) |
| `src/main.ts`            | the Worker entry                                                                      |
| `src/webhook/`           | `handleEnvSyncRequest`, `installationToken`, `pkcs8Of`, `signatureValid`, …          |
| `src/constants/`         | the environment map, the replay window, the value keys and the repository shape       |
| `src/interfaces/`        | the environment                                                                       |
| `src/webhook/__tests__/` | unit tests in Node with a stand-in fetch                                              |

## Commands

| Command                                         | Does                                      |
| ----------------------------------------------- | ----------------------------------------- |
| `pnpm --filter @figentra/worker-env-sync build` | bundle `src/main.ts` into `dist/main.mjs` |
| `pnpm --filter @figentra/worker-env-sync dev`   | build, then `wrangler dev`                |
| `pnpm --filter @figentra/worker-env-sync test`  | the unit tests                            |
| `typecheck` / `lint` / `format`                 | the usual checks                          |

## Deploy

`deploy-env-sync.yml` ships it on a main push that touches the member, after the owner's production approval, through
`runway-cloudflare-workers.yml` (the root runway's `targets.cloudflare-workers.members.env-sync`, preset `api`). The
job runs in the `env-sync` GitHub environment as the production identity and reads, from `ci-production` `prod`:
`CLOUDFLARE_API_TOKEN` (`/ci`), `INFISICAL_WEBHOOK_SECRET` (`/ci/env-sync`), and `STACKRA_BOT_APP_ID` and
`STACKRA_BOT_PRIVATE_KEY` (`/ci/release`, the `bot-app` read). Runway puts the three as Worker secrets, attaches
`env-sync.stackra.figentra.com`, and smoke-checks `/readyz`, which stays 503 until every secret binds. Without the
production identity id the job builds and deploys nothing. Never run `wrangler deploy` or `wrangler secret` by hand.

## Runbook

1. Infisical (SECRETS, runbook step 2 and 3): the production identity trusts the `env-sync` environment and
   `deploy-env-sync.yml`; `ci-production` `prod` has `/ci/env-sync` with `INFISICAL_WEBHOOK_SECRET` (a random value).
2. GitHub (INFRA-CODE): the `env-sync` environment, main only; the stackra-bot App installed with Actions write on
   every routed repository.
3. Set `ENV_SYNC_ROUTES` to each runtime project id and its repository.
4. In each Infisical runtime project, add a webhook to `https://env-sync.stackra.figentra.com/infisical` with the same
   secret and the event **Secret Modified** only, scoped to the runtime folders (`/runtime`).
5. Each routed repository carries `.github/workflows/env-sync.yml` (`workflow_dispatch` with `environment` and `path`)
   that calls `figentra/stackra/.github/workflows/runway-env-sync.yml`, and schedules it as the fallback.

## Not built

- The scheduled hash compare (ADR 0173 decision 6): callers schedule `runway-env-sync.yml` as the fallback; a true
  compare needs a record of the last-synced hashes, since Encore cannot read a value back.
