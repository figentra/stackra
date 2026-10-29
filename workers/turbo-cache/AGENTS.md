<!-- Purpose: rules for agents working in @figentra/worker-turbo-cache. Boundary: member guidance only. Runtime: docs. Governing contract: ADR 0026, ADR 0289 (decision 2), ADR 0284 (decision 8). -->

# AGENTS — @figentra/worker-turbo-cache

Stackra's Turborepo remote cache: a Cloudflare Worker (`stackra-turbo-cache`) serving turbo's v8 artifacts API from
the R2 bucket `turbo-cache` (ADR 0026). Member at `workers/turbo-cache` (`tier:app`, the tier `workers/*` reuses). The
entry is `src/main.ts`, built by tsdown into `dist/main.mjs`, which wrangler deploys. Read `README.md` first.

## Rules that fail the build

- Versions are `catalog:<name>` or `workspace:*` only; `wrangler` comes from `catalog:deploy`.
- `tsconfig.json` extends one `@stackra/typescript-config` preset and nothing else.

## Rules agents follow

- Never run `wrangler deploy`, `wrangler secret …` or anything that changes the Cloudflare account. Only
  `.github/workflows/deploy-turbo-cache.yml` deploys (main pushes and `workflow_dispatch`, never a pull request).
- The host `turbo.stackra.figentra.com` is the `routes` Custom Domain in `wrangler.jsonc`; keep `workers_dev` false.
- The deploy job reuses `INFISICAL_CI_IDENTITY_ID` in the `static` environment; never switch it to the gate identity,
  which pull requests can use.
- Fail closed: a missing token or setting answers 503 before any bucket call. Never add a default token or skip auth.
- Compare tokens only through `tokensMatch` (constant time); never log a token, header or artifact body.
- Every limit or TTL is a `vars` entry read by `readSettings`, never a literal in the handler.
- A team or hash reaches an R2 key only after `TEAM_PATTERN` / `ARTIFACT_HASH_PATTERN`.
- Name new declarations by scope or team, never tenant (R-59).
- Tests run in Node against `memoryBucket()`; the repo has no Workers test pool.
- Keep the `observability` block in `wrangler.jsonc` (Workers Logs, STA-1573): change the sampling there, and the
  uptime probe in the root `runway.yaml` `observability.uptime`, never in code.

## Tasks

`pnpm turbo run <task> --filter=@figentra/worker-turbo-cache` — `build`, `test`, `typecheck`, `lint`, `format`,
`format:check`, `clean`.

## PII

| Data | Where | Handling                                                                    |
| ---- | ----- | --------------------------------------------------------------------------- |
| None | R2    | Stores build outputs keyed by team and task hash; no personal data handled. |
