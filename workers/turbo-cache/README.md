<!-- Purpose: what @figentra/worker-turbo-cache is, its API, settings, layout, deploy and the CI env it needs. Boundary: member documentation only. Runtime: docs. Governing contract: ADR 0026, ADR 0289 (decisions 1 and 2), ADR 0171 (decision 6). -->

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

Never run `wrangler deploy` or `wrangler secret put` by hand. CI deploys.

## Infrastructure

The bucket `turbo-cache` with its 7-day lifecycle rule and the public host (a Workers Custom Domain) are declared by
`@stackra/infra-cloudflare` (`src/node/turbo-cache/`, or the core stack's `buckets` and zone `workers` config). No ADR
names the host; it is a stack setting.

## CI env (owned by the testing session's ci.yml)

From Infisical `/ci` over OIDC (ADR 0026 decision 2):

| Variable                           | Value                                                              |
| ---------------------------------- | ------------------------------------------------------------------ |
| `TURBO_API`                        | `https://<cache host>` (the custom domain), no trailing slash      |
| `TURBO_TOKEN`                      | the same value as the Worker secret `TURBO_CACHE_TOKEN`            |
| `TURBO_TEAM`                       | the team key, letters, digits, `_` or `-` (for example `figentra`) |
| `TURBO_REMOTE_CACHE_SIGNATURE_KEY` | the HMAC key turbo signs artifacts with (`signature: true`)        |

With those set, turbo uses the remote cache on its own (`remoteCache.enabled: true`); no `--remote-cache` flag is
needed. `--remote-only` skips the local cache; `--cache=local:rw,remote:r` keeps a job read-only (for pull requests from
forks). The deploy job of this Worker also needs `CLOUDFLARE_API_TOKEN` from `/ci`, a `pnpm build` before
`wrangler deploy`, and the secret set once with `wrangler secret put TURBO_CACHE_TOKEN`.

## Not built

- The deploy workflow and the ci.yml env (testing session).
- Usage events are dropped, not counted; `GET /v2/user` and `/v2/teams` (turbo's `login` flow) are not served.
- No per-team token: one token reaches every team's namespace.
