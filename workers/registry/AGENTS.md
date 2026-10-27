<!-- Stackra file contract. Purpose: agent rules for @figentra/worker-registry, the Stackra npm registry Worker. Boundary: documentation only. Runtime: documentation. Governing contract: ADR 0453; ADR 0284; ADR 0007. -->

# AGENTS — @figentra/worker-registry

The Stackra npm registry, Cloudflare Worker `stackra-registry` at `npm.stackra.figentra.com` (ADR 0453). Member at
`workers/registry` (`tier:app`). The entry is `src/main.ts`; tsdown bundles it to `dist/main.mjs`, which
`wrangler.jsonc` deploys. Read `README.md` for the routes, rules and settings.

## Rules that fail the build

- Versions are `catalog:<name>` or `workspace:*` only; `wrangler` comes from `catalog:deploy`.
- `tsconfig.json` extends one `@stackra/typescript-config` preset and nothing else.
- `src/` imports no `node:*` module (the Workers runtime has no Node compatibility flag); tests may.

## Rules agents follow

- Never run `wrangler deploy`, `wrangler secret …`, `wrangler d1 … --remote` or anything that changes the Cloudflare
  account. CI deploys.
- Every limit, TTL and URL is a `REGISTRY_*` var read by `readSettings`; never a constant in a handler. Scopes, read
  rules, licence rules and trusted publishers are D1 rows, added by a new numbered migration, never by code.
- Never edit an applied migration; add the next number. The licence tables are stackra-183's migration.
- Versions are immutable: no route deletes or overwrites a version, a tarball or a bundle (R2 writes go through
  `putOnce`). Deprecation is the only change to a version.
- Never proxy or fetch a package from another registry; an unknown name is 404.
- Tokens: store only SHA-256 hashes (`stkp_` publish tokens here, `stkl_` licence tokens in stackra-183); never log,
  echo or put a token into an error message or cache key.
- An `open` scope never reads the Authorization header. A `licensed` scope reads licences only through the
  `LicenceCheck` port (`src/access/licence-check.port.ts`).
- Responses use `json`/`failure` (npm's `{ error }` shape); Cache-Control follows ADR 0453 decision 5.
- Tests sit in `__tests__/` beside the code and use the fixtures in `src/__tests__/fixtures/`; the D1 fake runs the
  real migrations, so a schema change is tested by the existing suites.

## Tasks

`pnpm turbo run <task> --filter=@figentra/worker-registry` — `build`, `test`, `typecheck`, `lint`, `format`,
`format:check`, `clean`. `dev` builds and runs `wrangler dev` with local bindings.

## PII

| Data                     | Where                 | Handling                                                                       |
| ------------------------ | --------------------- | ------------------------------------------------------------------------------ |
| Licence holder reference | licence check, whoami | an opaque Figentra OS account reference; returned to its own token holder only |
| Downloads                | D1 `downloads_daily`  | counts per package, licence and day; no IP address, no user agent              |
| Publisher identity       | D1 `audit_events`     | repository and workflow run URL of a CI job; no person                         |
| Tokens                   | D1 `publish_tokens`   | SHA-256 hashes only; expired rows are deleted on the next exchange             |
