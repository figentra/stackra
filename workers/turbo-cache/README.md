<!-- Purpose: what @figentra/worker-turbo-cache is, its API, settings, layout, deploy, the owner runbook and the CI env it needs. Boundary: member documentation only. Runtime: docs. Governing contract: ADR 0026, ADR 0289 (decisions 1 and 2), ADR 0171 (decision 6), ADR 0284 (decision 8), ADR 0173. -->

# @figentra/worker-turbo-cache

Stackra's Turborepo remote cache: one Cloudflare Worker (`stackra-turbo-cache`) that implements Turborepo's
remote-cache HTTP API (v8 artifacts) over an R2 bucket
([ADR 0026](../../apps/docs/src/docs/adr/0026-turborepo-remote-cache-on-r2.mdx), built now by
[ADR 0289](../../apps/docs/src/docs/adr/0289-runway-and-environments-workers-one-encore-app-previews-and-publishing.mdx)
decision 2). No Vercel account is involved; switching provider changes only `TURBO_API` and `TURBO_TOKEN`.

## API

Every request needs `Authorization: Bearer <token>`, compared in constant time (SHA-256 of both sides) with the Worker
secret `TURBO_CACHE_TOKEN`. When the secret or any setting is missing or invalid, every request gets 503: the cache
fails closed. The team comes from the `teamId` query (else `slug`) and namespaces each key as
`<TURBO_CACHE_KEY_PREFIX><team>/<hash>`.

| Method and path             | Answer                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| `GET /v8/artifacts/status`  | `200 { "status": "enabled" }`                                                              |
| `POST /v8/artifacts/events` | `200`, the usage events are dropped                                                        |
| `PUT /v8/artifacts/:hash`   | `202 { "urls": ["<team>/<hash>"] }`; keeps `x-artifact-tag` and `x-artifact-duration`      |
| `GET /v8/artifacts/:hash`   | `200` with the bytes and `x-artifact-tag`, or `404`                                        |
| `HEAD /v8/artifacts/:hash`  | `200` with `x-artifact-tag`, or `404`                                                      |
| `POST /v8/artifacts`        | `{ hashes }` in; `{ <hash>: { size, taskDurationMs, tag } \| { error: { message } } }` out |

Errors use `{ "error": { "code", "message" } }`: 400 (team or hash shape, query body), 401 (token), 404, 405,
411 (upload without Content-Length), 413 (over the size setting), 503 (not configured). Artifacts are opaque: turbo
signs them (`remoteCache.signature: true` in the root `turbo.jsonc`) and rejects a bad tag itself.

## Settings

Every limit is a `vars` entry in `wrangler.jsonc` (change it there, or in the dashboard, without a code change).

| Variable                         | Default     | Meaning                                                                     |
| -------------------------------- | ----------- | --------------------------------------------------------------------------- |
| `TURBO_CACHE_MAX_ARTIFACT_BYTES` | `104857600` | largest upload (100 MiB); bigger gets 413                                   |
| `TURBO_CACHE_KEY_PREFIX`         | `v8/`       | prefix of every R2 key                                                      |
| `TURBO_CACHE_TTL_SECONDS`        | `604800`    | an older artifact is a miss (7 days: turbo's `cacheMaxAge` and the R2 rule) |
| `TURBO_CACHE_MAX_QUERY_HASHES`   | `100`       | most hashes one `POST /v8/artifacts` may ask about                          |
| `TURBO_CACHE_TOKEN` (secret)     | none        | the bearer token; unset means every request gets 503                        |

## Layout

| Path                   | Holds                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `wrangler.jsonc`       | Worker name, account, pinned compatibility date, the R2 binding, the settings          |
| `src/main.ts`          | the Worker entry                                                                       |
| `src/cache/`           | `handleTurboCacheRequest`, `readSettings`, `tokensMatch`                               |
| `src/constants/`       | the hash and team shapes allowed into a key                                            |
| `src/interfaces/`      | the environment, the R2 binding (structural) and the settings                          |
| `src/cache/__tests__/` | unit tests in Node against an in-memory R2 stand-in (`fixtures/memory-bucket.fixture`) |

## Commands

| Command                                            | Does                                       |
| -------------------------------------------------- | ------------------------------------------ |
| `pnpm --filter @figentra/worker-turbo-cache build` | bundle `src/main.ts` into `dist/main.mjs`  |
| `pnpm --filter @figentra/worker-turbo-cache dev`   | build, then `wrangler dev` with a local R2 |
| `pnpm --filter @figentra/worker-turbo-cache test`  | the unit tests                             |
| `typecheck` / `lint` / `format`                    | the usual checks                           |

## Deploy (CI only)

`.github/workflows/deploy-turbo-cache.yml` deploys on every push to `main` that touches `workers/turbo-cache/**` (or the
workflow), and by hand (`workflow_dispatch`, main only). Never on a pull request. Its steps:

1. install, then `turbo run test build` for this member (a failing test never reaches Cloudflare);
2. read `CLOUDFLARE_API_TOKEN` from Infisical `prod` `/ci` over GitHub OIDC;
3. create the R2 bucket `turbo-cache` if `wrangler r2 bucket list` does not show it, and add the lifecycle rule
   `expire-after-7-days` (`--expire-days 7`) if `wrangler r2 bucket lifecycle list` does not show it;
4. `wrangler deploy`, which also attaches the Custom Domain `turbo.stackra.figentra.com` (`routes` in `wrangler.jsonc`);
5. read `TURBO_TOKEN` from the same path and pipe it into `wrangler secret put TURBO_CACHE_TOKEN` (stdin, never printed);
   an empty or missing `TURBO_TOKEN` fails the step by name;
6. smoke: `GET https://turbo.stackra.figentra.com/v8/artifacts/status` with the bearer until it answers 200, ten
   minutes at most (a new Custom Domain needs a few minutes for its certificate).

Identity: the job reuses the existing Infisical identity `INFISICAL_CI_IDENTITY_ID` (the one `deploy-static.yml` and
`deploy-docs.yml` use) and runs in the GitHub environment `static`, whose OIDC subject that identity already trusts, so
no identity, trust or environment is created. The gate identity (`INFISICAL_GATE_IDENTITY_ID`) is not used: it also
trusts pull requests and may read only the two licence tokens (ADR 0310). Without `INFISICAL_CI_IDENTITY_ID` the job
tests, builds, prints a notice and deploys nothing.

Never run `wrangler deploy` or `wrangler secret put` by hand.

## Owner runbook

The owner's only steps; everything else is the workflow's.

1. Make two random values on your own machine: `openssl rand -hex 32`, twice (one token, one signature key).
2. In Infisical, environment `prod`, path `/ci`, add:

   | Secret                             | Value                                |
   | ---------------------------------- | ------------------------------------ |
   | `TURBO_TOKEN`                      | the first value                      |
   | `TURBO_REMOTE_CACHE_SIGNATURE_KEY` | the second value                     |
   | `TURBO_TEAM`                       | `figentra`                           |
   | `TURBO_API`                        | `https://turbo.stackra.figentra.com` |

   `CLOUDFLARE_API_TOKEN` is already there (the static and docs deploys use it); it needs the Workers Scripts, Workers
   Custom Domains (zone `figentra.com`) and R2 edit permissions.

3. Run the workflow once: GitHub, Actions, "Deploy turbo cache", Run workflow on `main`. It ends with the smoke test.

To rotate the token, change `TURBO_TOKEN` in Infisical and run the workflow again; the secret is put on every run.

## Infrastructure

The deploy job creates the bucket `turbo-cache`, its 7-day lifecycle rule and the Custom Domain when they are missing.
`@stackra/infra-cloudflare` (`src/node/turbo-cache/`) declares the same bucket and rule for Pulumi; when that stack is
applied, leave its `domain` unset so the Custom Domain has one owner (wrangler).

## CI env (owned by the testing session's ci.yml)

From Infisical `/ci` over OIDC (ADR 0026 decision 2):

| Variable                           | Value                                                              |
| ---------------------------------- | ------------------------------------------------------------------ |
| `TURBO_API`                        | `https://turbo.stackra.figentra.com`, no trailing slash            |
| `TURBO_TOKEN`                      | the same value as the Worker secret `TURBO_CACHE_TOKEN`            |
| `TURBO_TEAM`                       | the team key, letters, digits, `_` or `-` (for example `figentra`) |
| `TURBO_REMOTE_CACHE_SIGNATURE_KEY` | the HMAC key turbo signs artifacts with (`signature: true`)        |

With those set, turbo uses the remote cache on its own (`remoteCache.enabled: true`); no `--remote-cache` flag is
needed. `--remote-only` skips the local cache; `--cache=local:rw,remote:r` keeps a job read-only (for pull requests from
forks). `ci.yml` reads them; this member's deploy job does not change it.

## Not built

- The ci.yml env (testing session).
- Not checked from here: that the role of `INFISICAL_CI_IDENTITY_ID` reads all of `/ci`. It reads
  `CLOUDFLARE_API_TOKEN` there for the static deploy; if its role names single secrets, it also needs `TURBO_TOKEN`.
- Usage events are dropped, not counted; `GET /v2/user` and `/v2/teams` (turbo's `login` flow) are not served.
- No per-team token: one token reaches every team's namespace.
