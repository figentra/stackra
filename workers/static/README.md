# @figentra/worker-static

Stackra's hosted static files: one Cloudflare Worker (`stackra-static`) with static assets only and no Worker script
([ADR 0284](../../apps/docs/src/docs/adr/0284-hosted-static-files-one-cloudflare-static-assets-worker.mdx)). It serves
`https://static.stackra.figentra.com/`. Each kind of file has its own first path segment: `/schemas/` today, more
kinds (CDN files, install scripts) later in the same member. It sits beside the other Stackra hosts on the
`figentra.com` zone: `docs.stackra.figentra.com` (Mintlify) and `npm.stackra.figentra.com` (the `npm-registry`
Worker).

## What it serves

The build reads the JSON Schemas in `tools/schemas/*.schema.json` (STA-305) at the working tree and at every
`schemas@<x.y.z>` git tag. Each schema's `$id` decides its path. For `$id`
`https://static.stackra.figentra.com/schemas/runway/app.json`:

| Path                              | Content                                | Cache-Control                                    |
| --------------------------------- | -------------------------------------- | ------------------------------------------------ |
| `/schemas/runway/app.json`        | `main` (the `$id` itself)              | Cloudflare default: `max-age=0, must-revalidate` |
| `/schemas/latest/runway/app.json` | `main`                                 | Cloudflare default                               |
| `/schemas/v1/runway/app.json`     | the newest `schemas@1.x.y` release     | Cloudflare default                               |
| `/schemas/1.4.0/runway/app.json`  | the `schemas@1.4.0` tag, never changes | `public, max-age=31536000, immutable`            |
| `/schemas/index.json`             | every latest schema and every release  | Cloudflare default                               |
| `/`                               | the landing page (`index.html`)        | `public, max-age=300`                            |
| any unknown path                  | the same page (`404.html`), status 404 | Cloudflare default                               |

Every response carries `Access-Control-Allow-Origin: *`. Each published copy has `$id` rewritten to its own URL, so a
pinned version never resolves references against `latest`. Headers come from a generated `_headers` file, which
Cloudflare applies to static assets.

People who open the host in a browser get one branded Stackra page ("Nothing to see here", a link to the docs, the
legal footer): at `/`, and as the 404 body for any unknown path (`not_found_handling: "404-page"`). It lists no
schema, runs no script and makes no request: the wordmark, colours and type of the stackra theme are inlined
(`src/site/render-page.ts`).

## Layout

| Path                  | Holds                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `wrangler.jsonc`      | Worker name, account, pinned compatibility date, assets folder, the custom domain                |
| `src/main.ts`         | build entry: read, plan, write `dist/site`                                                       |
| `src/site/`           | the builder: readers (working tree, git tags), `planSite`, `renderHeaders`, `renderPage`, writer |
| `src/constants/`      | host, `/schemas` prefix, schemas folder, tag prefix, Cache-Control values, logo                  |
| `src/interfaces/`     | the shapes passed between the builder's steps                                                    |
| `src/site/__tests__/` | unit tests: URL layout, `$id` rewrite, validation, `_headers`, releases, the page                |

## Commands

| Command                                       | Does                                                                              |
| --------------------------------------------- | --------------------------------------------------------------------------------- |
| `pnpm --filter @figentra/worker-static build` | bundle `src/main.ts` with tsdown, run it, write `dist/site`                       |
| `pnpm --filter @figentra/worker-static dev`   | `wrangler dev`: serve `dist/site` locally with the `_headers` rules (build first) |
| `pnpm --filter @figentra/worker-static test`  | the unit tests                                                                    |
| `typecheck` / `lint` / `format`               | the usual checks                                                                  |

Never run `wrangler deploy` by hand. CI deploys.

## Deploy

`.github/workflows/deploy-static.yml` runs on a push to `main` that touches this member or `tools/schemas/`, on a pushed
`schemas@*` tag reachable from `main`, and by hand (`workflow_dispatch`). It checks out with every tag, runs the tests,
builds, fetches `CLOUDFLARE_API_TOKEN` from Infisical `/ci` (environment `prod`) through GitHub OIDC, and runs
`wrangler deploy`. Until the owner prerequisites below exist, the job prints a notice and skips the deploy, so `main`
stays green.

To publish a schema release: tag a commit on `main` `schemas@1.0.0` and push the tag. Never move or delete a
`schemas@*` tag: the exact-version paths are rebuilt from tags on every deploy.

## Owner prerequisites (once)

1. An account-owned Cloudflare API token `stackra-static-deploy` (account Figentra Technologies L.L.C.) with exactly:
   Account · Workers Scripts · Edit (all Workers: the first deploy creates `stackra-static`, which a per-Worker scope
   cannot), and Zone · Workers Routes · Edit on `figentra.com` (attaching the Custom Domain, which also creates its DNS
   record and certificate).
2. Store it in Infisical, environment `prod`, path `/ci`, secret `CLOUDFLARE_API_TOKEN`.
3. An Infisical machine identity with OIDC auth for GitHub: issuer `https://token.actions.githubusercontent.com`,
   subject `repo:figentra/stackra:environment:static`, audience `https://github.com/figentra`; read access to `/ci` in
   `prod` only (STA-15).
4. GitHub repository variable `INFISICAL_CI_IDENTITY_ID` = that identity's id (an id, not a secret).
5. GitHub environment `static`, restricted to `main` and `schemas@*` tags.

The account id lives in `wrangler.jsonc`; it identifies the account and grants nothing.
