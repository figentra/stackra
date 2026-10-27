# `workers/`

Cloudflare Worker members, one workspace member each
([ADR 0284](../apps/docs/src/docs/adr/0284-hosted-static-files-one-cloudflare-static-assets-worker.mdx)). A Worker is
deployed, so it reuses the app tier: `tier:app` in its `turbo.jsonc`.

| Worker                       | Package                        | What it is                                                                                     |
| ---------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| [`static`](static)           | `@figentra/worker-static`      | `stackra-static`: the hosted static files at `static.stackra.figentra.com` (`/schemas/…`)      |
| [`turbo-cache`](turbo-cache) | `@figentra/worker-turbo-cache` | `stackra-turbo-cache`: the Turborepo remote cache, turbo's v8 artifacts API over R2 (ADR 0026) |

## Rules

- A Worker member is named `@figentra/worker-<dir>`, keeps its code in `src/` and declares `tier:app` (`pnpm validate`).
- It imports packages only, never a service, an app or another Worker
  ([ADR 0003](../apps/docs/src/docs/adr/0003-tier-dependency-direction.mdx)).
- It carries `README.md`, `AGENTS.md` (with a `## PII` section) and `CHANGELOG.md`, and no `LICENSE` (UNLICENSED,
  ADR 0195). It deploys by commit SHA from CI only; nobody runs `wrangler deploy` by hand.
- Its `wrangler.jsonc` is hand-written until `stackra gen` emits Workers config (ADR 0284 decision 8).
