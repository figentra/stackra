<!-- Stackra file contract. Purpose: agent rules for @figentra/worker-edge, the Stackra edge Worker. Boundary: documentation only. Runtime: documentation. Governing contract: ADR 0437; ADR 0206; ADR 0284; ADR 0007. -->

# AGENTS — @figentra/worker-edge

The Stackra edge Worker, `stackra-edge` (ADR 0437). Member at `workers/edge` (`tier:app`). The entry is
`src/main.ts`; tsdown bundles it, with what it imports from `@stackra/app`, to `dist/main.mjs`, which `wrangler.jsonc`
deploys. Read `README.md` for the request steps and settings.

## Rules that fail the build

- Versions are `catalog:<name>` or `workspace:*` only; `wrangler` comes from `catalog:deploy`.
- `tsconfig.json` extends one `@stackra/typescript-config` preset and nothing else: `decorators`, because the type check reads `@stackra/app`'s decorated sources. The same sources augment `@stackra/navigation`, so the Worker declares it as a devDependency (TS2664 otherwise).
- `src/` imports no `node:*` module and only the runtime-neutral entries of `@stackra/app` (`.` and `./contracts`);
  tests may import `@stackra/app/server`.

## Rules agents follow

- Never run `wrangler deploy`, `wrangler secret …` or anything that changes the Cloudflare account. Never add a route
  or custom domain: the owner decides the hosts.
- The signed bytes are `signEdgeRequest`'s only; never join the fields here. A new signed field changes
  `EdgeSignatureInput`, `signEdgeRequest` and `EdgeHeaderGuard` together.
- Token checks are `verifyBearerToken`'s only; never verify a JWT by hand here and never accept `none` or HS*.
- Strip every `EdgeHeader` from the inbound request before setting the Worker's own.
- The Worker never authorises: forward `Authorization` untouched and add no user or role header.
- Every value is an `EDGE_*` var read by `readSettings`; the signing secret is the `EDGE_SIGNING_SECRET` Worker secret,
  never a var, never logged.

## Tasks

`pnpm turbo run <task> --filter=@figentra/worker-edge` — `build`, `test`, `typecheck`, `lint`, `format`,
`format:check`, `clean`. `dev` builds and runs `wrangler dev`.

## PII

| Data         | Where                       | Handling                                                                  |
| ------------ | --------------------------- | ------------------------------------------------------------------------- |
| Bearer token | `Authorization`, in transit | verified in memory and forwarded; never logged, stored or put in an error |
| Request body | in transit                  | hashed and forwarded; never stored                                        |
| Client IP    | Workers Logs                | Cloudflare's invocation logs only; the Worker logs nothing of its own     |
