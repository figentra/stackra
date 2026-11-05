<!-- Purpose: rules for agents working in @figentra/worker-env-sync. Boundary: member guidance only. Runtime: docs. Governing contract: ADR 0173 (amendment of 2026-11-04, decision 6), ADR 0284, ADR 0519. -->

# AGENTS — @figentra/worker-env-sync

Stackra's environment-sync webhook: a Cloudflare Worker (`stackra-env-sync`) that verifies Infisical's webhook and
dispatches the owning repository's `env-sync.yml` (ADR 0173, amendment of 2026-11-04). Member at `workers/env-sync`
(`tier:app`, the tier `workers/*` reuses). The entry is `src/main.ts`, built by tsdown into `dist/main.mjs`, which
wrangler deploys. Read `README.md` first.

## Rules that fail the build

- Versions are `catalog:<name>` or `workspace:*` only; `wrangler` comes from `catalog:deploy`.
- `tsconfig.json` extends one `@stackra/typescript-config` preset and nothing else.
- `wrangler.jsonc` holds code facts only (ADR 0519); operational settings belong to runway.

## Rules agents follow

- Never run `wrangler deploy`, `wrangler secret …` or anything that changes the Cloudflare account. The Worker is not
  in the root runway yet; adding it is the owner's decision.
- Fail closed: a missing webhook secret or a bad signature answers 401 before the body is parsed. Never add a default
  secret or skip the signature.
- Compare signatures only through `tokensMatch` (constant time); never log a token, header or body.
- The webhook carries metadata only: keep refusing any payload with a value key (`carriesValue`).
- A repository reaches the GitHub URL only after `REPOSITORY_PATTERN`.
- Tests run in Node with a stand-in fetch; the repo has no Workers test pool.

## Tasks

`pnpm turbo run <task> --filter=@figentra/worker-env-sync` — `build`, `test`, `typecheck`, `lint`, `format`,
`format:check`, `clean`.

## PII

| Data | Where | Handling                                                                                |
| ---- | ----- | --------------------------------------------------------------------------------------- |
| None | none  | Reads project ids, environment slugs and secret paths; stores nothing, holds no values. |
