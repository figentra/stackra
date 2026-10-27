<!-- Stackra file contract. Purpose: the README of @figentra/worker-registry, the Stackra npm registry Worker: routes, storage, publishing, read rules, the licence engine and its API, settings, layout, deploy and the owner runbook (deploy, first publish of the presets). Boundary: documentation only; ADR 0453 is the decision. Runtime: documentation. Governing contract: ADR 0453; ADR 0284; ADR 0289; ADR 0173; ADR 0007. -->

# @figentra/worker-registry

The Stackra registry: one Cloudflare Worker (`stackra-registry`) at `https://npm.stackra.figentra.com/` that serves
every `@stackra/*` and `@stackra-pro/*` item (packages, skills, agents, MCP servers and plugins) over the subset of the
npm registry protocol that npm, pnpm and Yarn need
([ADR 0453](../../apps/docs/src/docs/adr/0453-the-stackra-registry-one-npm-compatible-store-on-cloudflare-and-our-own-licence-engine.mdx)).
R2 holds the bytes, D1 the truth, KV the caches. It never proxies an upstream.

## Consumers

```ini
@stackra:registry=https://npm.stackra.figentra.com/
@stackra-pro:registry=https://npm.stackra.figentra.com/
//npm.stackra.figentra.com/:_authToken=${STACKRA_LICENCE_TOKEN}
```

`@stackra` reads need no token (a token sent is ignored). `@stackra-pro` reads need a licence token whose licence is
active, inside its dates plus the grace days, with a grant covering the name: no or unknown token is 401, anything
else refused is 403. A name with an `internal` row in `name_rules` (today `@stackra-pro/ui`, ADR 0461 decision 3) is
read only by an internal licence whose grants cover it; a customer licence, `names: "*"` included, gets 403, and the
catalogue never lists it.

## Routes

| Method and path                                              | Does                                                            | Auth                       |
| ------------------------------------------------------------ | --------------------------------------------------------------- | -------------------------- |
| `GET /-/ping`                                                | health                                                          | none                       |
| `GET /-/whoami`                                              | `ci:<repository>` for a publish token, the holder for a licence | any token                  |
| `GET /@scope/name`                                           | packument; the install media type gets the abbreviated form     | scope read rule            |
| `GET /@scope/name/<version-or-tag>`                          | one version manifest                                            | scope read rule            |
| `GET /@scope/name/-/name-<version>.tgz`                      | tarball from R2                                                 | scope read rule            |
| `PUT /@scope%2fname`                                         | publish one version, or deprecate (no attachment)               | publish token for the name |
| `GET /-/package/@scope%2fname/dist-tags`                     | dist-tags                                                       | scope read rule            |
| `PUT`, `DELETE /-/package/@scope%2fname/dist-tags/<tag>`     | move or drop a tag (`latest` cannot be dropped)                 | publish token for the name |
| `POST /-/npm/v1/oidc/token/exchange/package/@scope%2fname`   | GitHub ID token for a publish token                             | GitHub OIDC                |
| `GET /-/npm/v1/keys`                                         | the signing keys in npm's shape                                 | none                       |
| `GET /-/npm/v1/attestations/@scope%2fname@<version>`         | the provenance bundle                                           | scope read rule            |
| `GET /-/stackra/v1/catalogue?kind=&scope=&q=&cursor=&limit=` | `CataloguePage`, newest publish first                           | none                       |
| `GET /-/stackra/v1/catalogue/@scope/name`                    | one `CatalogueItem` with its versions                           | none                       |
| `GET /-/stackra/v1/entitlements`                             | `{ holder, grants, expiresAt, status }`                         | licence token              |
| `/-/stackra/v1/licences…`                                    | the licence API (below)                                         | issuer token               |
| `PUT /-/user/*`                                              | 403: there is no login, see the licence docs                    | —                          |
| `DELETE` of a package or version                             | 405: versions are immutable                                     | —                          |
| anything else (search, audit, unknown or unscoped names)     | 404                                                             | —                          |

## Licences

A licence is a `licences` row (`holder_ref`, the opaque Figentra OS account; `status` `active`, `suspended` or
`revoked`; `not_before`, `expires_at`; `internal`), its `licence_grants` (one row per scope and name, `*` for every
name; only `licensed` scopes) and its `licence_tokens`: `stkl_` and 43 base64url characters (32 random bytes), shown
once, stored as SHA-256 only, at most `REGISTRY_LICENCE_MAX_TOKENS` live ones, each revocable on its own. Reads stop
when the licence is suspended or revoked and `REGISTRY_LICENCE_GRACE_DAYS` after `expires_at`; the edge cache means a
change is seen within `REGISTRY_TOKEN_CACHE_SECONDS`. `D1LicenceCheck` (`src/licence/`) is the `LicenceCheck` bound in
`main.ts`.

The licence API, the OS billing hook; it answers `RegistryLicence` of `@stackra/licensing/contracts`, and the
`registry` `LicenceIssuer` driver of `@stackra/licensing` is its client:

| Method and path                                               | Body                                                      | Answers |
| ------------------------------------------------------------- | --------------------------------------------------------- | ------- |
| `POST /-/stackra/v1/licences`                                 | `{ holderRef, grants, notBefore, expiresAt, tokenLabel }` | 201     |
| `PATCH /-/stackra/v1/licences/:id`                            | `{ expiresAt }` and/or `{ grants }`                       | 200     |
| `POST /-/stackra/v1/licences/:id/suspend`, `resume`, `revoke` | —                                                         | 200     |
| `POST /-/stackra/v1/licences/:id/tokens`                      | `{ label }`                                               | 201     |
| `DELETE /-/stackra/v1/licences/:id/tokens/:tokenId`           | —                                                         | 200     |

Every call sends `Authorization: Bearer <issuer token>` (401 otherwise) and `Idempotency-Key` (the OS event id; 400
without). A repeat of the same request answers the stored body with `idempotent-replayed: true` and `issuedToken: null`
(a token is shown once); the same key with another request is 409. Body errors are 400, a grant on a scope that is not
`licensed` or one token too many is 422, an unknown licence or token is 404, anything but `revoke` on a revoked
licence is 409. Every call writes an `audit_events` row (`licence.<action>`, the licence id, `issuer:<label>`, the key).

### Issuer tokens

The owner makes one per caller (OS billing), stores its value in Infisical `prod` `/registry` as
`REGISTRY_ISSUER_TOKEN` (the name `@stackra/licensing`'s `IssuerConfig` reads) and inserts only its hash:
`INSERT INTO issuer_tokens (hash, label, created_at) VALUES ('<sha256 hex>', 'os-billing', '<now>')`, through the
migration CI job or the Cloudflare dashboard. Rotate by inserting the new hash, then setting `revoked_at` on the old row.

### Internal licences

Only the owner sets `licences.internal = 1` (Figentra's own products, ADR 0461 decision 7); the licence API never does,
so no billing event can open an internal name. Issue the licence through the API, then set the flag on its id.

## Publishing

Only the release workflows publish (`publishers` rows: `figentra/stackra` for `@stackra`, `figentra/stackra-pro` for
`@stackra-pro`, workflow `.github/workflows/release.yml`, ref `refs/heads/main`, environment `release`, matched on the
numeric repository and owner ids too). The job asks GitHub for an ID token with audience
`npm:npm.stackra.figentra.com` and exchanges it for a `stkp_` publish token bound to one package for
`REGISTRY_PUBLISH_TOKEN_SECONDS`. A publish is refused when the version exists, the tarball is over the size limit,
package.json's name or version differs from the request, `stackra.kind` is unknown or a non-package item is not named
`@<scope>/<kind>-<name>`, the scope's licence rule fails (commercial: the scope's licence string, a LICENSE file, no
`src/`, no `.map`; open-source: MIT, or another open licence with a NOTICE), the client's integrity or shasum differs,
or the Sigstore bundle is missing, is for another digest or was signed by another workflow. Each version is signed
(ECDSA P-256 over `<name>@<version>:<integrity>`); every publish, tag change, deprecation and token exchange is an
`audit_events` row naming the workflow run.

## Settings

Every limit is a Worker var in `wrangler.jsonc` (`src/settings/read-settings.ts` refuses a missing one):

| Var                               | ADR setting                    | Default                                       |
| --------------------------------- | ------------------------------ | --------------------------------------------- |
| `REGISTRY_HOST`                   | —                              | `npm.stackra.figentra.com`                    |
| `REGISTRY_MAX_TARBALL_BYTES`      | `registry.maxTarballBytes`     | 52428800 (50 MiB)                             |
| `REGISTRY_MAX_UNPACKED_BYTES`     | —                              | 104857600 (gzip bomb guard)                   |
| `REGISTRY_PUBLISH_TOKEN_SECONDS`  | `registry.publishTokenSeconds` | 900                                           |
| `REGISTRY_TOKEN_CACHE_SECONDS`    | `registry.tokenCacheSeconds`   | 60                                            |
| `REGISTRY_LICENCE_GRACE_DAYS`     | `registry.licence.graceDays`   | 14                                            |
| `REGISTRY_LICENCE_MAX_TOKENS`     | `registry.licence.maxTokens`   | 20 live tokens per licence                    |
| `REGISTRY_OIDC_ISSUER`            | —                              | `https://token.actions.githubusercontent.com` |
| `REGISTRY_OIDC_KEYS_SECONDS`      | —                              | 3600                                          |
| `REGISTRY_OPEN_PACKUMENT_MAX_AGE` | —                              | 60 (also the keys and catalogue max-age)      |
| `REGISTRY_CATALOGUE_MAX_LIMIT`    | —                              | 100                                           |
| `REGISTRY_LICENCE_DOCS_URL`       | —                              | where `npm login` is pointed                  |
| `REGISTRY_SIGNING_KEY_EXPIRES`    | —                              | `""` (none)                                   |
| `REGISTRY_RETIRED_KEYS`           | —                              | `[]`                                          |

Secret: `REGISTRY_SIGNING_KEY`, the PKCS#8 PEM of the ECDSA P-256 key (Infisical `prod` `/registry`). To rotate, move
the old key's SPKI (base64, from `/-/npm/v1/keys`) into `REGISTRY_RETIRED_KEYS` with its `expires`, then set the new
secret.

## Layout

| Path                      | Holds                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| `wrangler.jsonc`          | Worker name, script, bindings, vars, the custom domain                                   |
| `migrations/`             | numbered D1 migrations; `0001` scopes and publishers, `0002` licences and `name_rules`   |
| `src/main.ts`             | the Worker entry: builds the dependencies, hands over to `handleRequest`                 |
| `src/http/`               | `parsePath`, `splitName`, the router, `json` and `failure`                               |
| `src/npm/`                | the npm read routes (`handle*`), packument rendering and its KV cache, R2 keys           |
| `src/publish/`            | publish and dist-tag writes, publish auth, tarball reader, digests, content checks       |
| `src/oidc/`               | GitHub OIDC verification, the key set, publisher matching, the token exchange            |
| `src/access/`             | the `LicenceCheck` port, the edge-cache wrapper, the read rule (`gate`, `readAccess`)    |
| `src/licence/`            | the licence API, `LicenceStore`, `D1LicenceCheck`, token minting, grant folding          |
| `src/signing/`            | the ECDSA P-256 signer, keyids, DER signatures                                           |
| `src/catalogue/`          | the catalogue API and entitlements                                                       |
| `src/store/`              | `RegistryStore`, every D1 query                                                          |
| `src/settings/`           | the vars parsed into settings                                                            |
| `src/bytes/`              | base64, base64url, hex, SHA-256 of a token                                               |
| `src/constants/`          | Cache-Control values, the kinds list, the publish token prefix                           |
| `src/interfaces/`         | one shape per file: bindings, env, settings, catalogue, D1 rows, verdicts                |
| `src/__tests__/fixtures/` | D1 over node:sqlite with the migrations, R2/KV/cache/licence fakes, tarballs, a registry |

One exported declaration per file, named after it (ADR 0305 rules 10 to 13).

## Commands

| Command                                         | Does                                                  |
| ----------------------------------------------- | ----------------------------------------------------- |
| `pnpm --filter @figentra/worker-registry build` | bundle `src/main.ts` into `dist/main.mjs` with tsdown |
| `pnpm --filter @figentra/worker-registry dev`   | build, then `wrangler dev` with local bindings        |
| `pnpm --filter @figentra/worker-registry test`  | the tests (node; no Workers pool needed)              |
| `typecheck` / `lint` / `format`                 | the usual checks                                      |

Never run `wrangler deploy` or `wrangler d1 migrations apply --remote` by hand. CI deploys
(`.github/workflows/deploy-registry.yml`, GitHub environment `registry`), on every push to main that touches this
member and by hand (Actions, "Deploy registry", Run workflow on `main`).

## Deploy and first publish (owner runbook)

Owner decision D8 (2026-10-28, stackra-212): deploy the registry now and publish only the five tooling presets as
`0.1.0-next.<n>` under the `next` dist-tag. Every step below is the owner's; agents run none of them. Commands that
need the account run where `CLOUDFLARE_API_TOKEN` is already in the shell's environment (never pasted into a
command line).

### 1. Resources

Either through Pulumi, adding `registryWorker` of `@stackra/infra-cloudflare/node` to the Cloudflare stack (no stack
calls it yet):

```ts
const registry = registryWorker({
  accountId,
  zoneId: zone.id,
  hostname: "npm.stackra.figentra.com",
  script: "stackra-registry",
  bucket: "stackra-registry",
  database: "stackra-registry",
  namespace: "stackra-registry-cache",
  importDomain: "<id of the npflared custom domain, ADR 0453 decision 17>",
});
export const registryD1DatabaseId = registry.database.id;
export const registryKvNamespaceId = registry.namespace.id;
```

or with wrangler once, from `workers/registry` (the bucket name and the database name must match `wrangler.jsonc`):

```sh
pnpm exec wrangler r2 bucket create stackra-registry
pnpm exec wrangler d1 create stackra-registry          # prints database_id
pnpm exec wrangler kv namespace create stackra-registry-cache   # prints id
```

Put the two ids into the GitHub environment `registry` (Settings, Environments) as **variables**, not secrets, and
never into `wrangler.jsonc` (it keeps the zero ids; CI substitutes them on the runner):

| Variable                         | Value                                       |
| -------------------------------- | ------------------------------------------- |
| `REGISTRY_D1_DATABASE_ID`        | the D1 uuid                                 |
| `REGISTRY_KV_NAMESPACE_ID`       | the KV namespace id (32 hex)                |
| `INFISICAL_REGISTRY_IDENTITY_ID` | the Infisical machine identity the job uses |

Restrict the `registry` environment to `main`. The Infisical identity trusts GitHub OIDC for the subject
`repo:figentra/stackra:environment:registry` and reads `prod` `/ci` (`CLOUDFLARE_API_TOKEN`) and `prod` `/registry`
(`REGISTRY_SIGNING_KEY`). The Cloudflare token needs Workers Scripts, D1, Workers KV and Workers Routes edit on the
account and the zone. The custom domain `npm.stackra.figentra.com` must leave the npflared `npm-registry` Worker first
(decision 17), or `wrangler deploy` refuses the route.

### 2. Signing key

An ECDSA P-256 key in PKCS#8 PEM (the form `src/signing/create-signer.ts` imports), generated on the owner's machine
straight into the secrets inbox:

```sh
openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out ~/Secrets-inbox/REGISTRY_SIGNING_KEY.pem
printf 'env: prod\npath: /registry\n' > ~/Secrets-inbox/REGISTRY_SIGNING_KEY.target.yaml
pnpm secrets:import --dry-run   # then the import with the printed --confirm token
```

### 3. Issuer token

One per licence API caller (OS billing). Make the value, keep only its SHA-256 hex for D1, and import the value to
Infisical `prod` `/registry` as `REGISTRY_ISSUER_TOKEN` the same way:

```sh
openssl rand -base64 32 | tr '+/' '-_' | tr -d '=\n' > ~/Secrets-inbox/REGISTRY_ISSUER_TOKEN
printf 'env: prod\npath: /registry\n' > ~/Secrets-inbox/REGISTRY_ISSUER_TOKEN.target.yaml
shasum -a 256 < ~/Secrets-inbox/REGISTRY_ISSUER_TOKEN | cut -d' ' -f1   # the hash, safe to show
pnpm secrets:import --dry-run   # then the import with the printed --confirm token
```

After the first deploy (step 4 creates the tables), insert the hash:

```sh
pnpm exec wrangler d1 execute stackra-registry --remote --command \
  "INSERT INTO issuer_tokens (hash, label, created_at) VALUES ('<sha256 hex>', 'os-billing', '$(date -u +%FT%T.000Z)')"
```

### 4. Deploy

Run "Deploy registry" on `main`. It tests and builds this member, puts the ids into the runner's `wrangler.jsonc`,
applies the migrations (`wrangler d1 migrations apply stackra-registry --remote`), runs `wrangler deploy`, sets
`REGISTRY_SIGNING_KEY` from Infisical through stdin, and waits for `/-/ping` and `/-/npm/v1/keys` to answer 200 with at
least one key. Without `INFISICAL_REGISTRY_IDENTITY_ID` it builds, tests and deploys nothing. Check by hand too:

```sh
curl -fsS https://npm.stackra.figentra.com/-/ping
curl -fsS https://npm.stackra.figentra.com/-/npm/v1/keys   # keytype ecdsa-sha2-nistp256, keyid SHA256:…
```

### 5. Dry run, then publish `next`

Actions, "Release", Run workflow on `main`:

1. `dry_run` on: packs every published package through the `.pnpmfile.mjs` hook; nothing leaves the runner.
2. `prerelease` on, `packages` left at its default (the five presets), `dist_tag` `next`, `base_version` `0.1.0`.
   The `release` environment waits for the owner's approval. The job sets `0.1.0-next.<run number>` on the
   runner only (nothing is committed, tagged or pushed), builds them, and publishes each through its own OIDC
   exchange with `pnpm publish --provenance --tag next`. A re-run skips a version that is already there.

`@stackra/oxlint-config` has `@stackra/coding-standard` as a peer (`workspace:*`, which pnpm publish writes as that
package's own version, `0.0.0` today, when it is not in the filter). If the clean install below fails on that peer,
add `@stackra/coding-standard` to `packages` and run the prerelease again: both then carry the same `0.1.0-next.<n>`.

### 6. Install from a clean folder

```sh
mkdir /tmp/stackra-next && cd /tmp/stackra-next
printf '@stackra:registry=https://npm.stackra.figentra.com/\n' > .npmrc
pnpm init
pnpm add -D @stackra/oxlint-config@next @stackra/typescript-config@next @stackra/vitest-config@next \
  @stackra/tsdown-config@next @stackra/commitlint-config@next
pnpm view @stackra/oxlint-config dist-tags --registry https://npm.stackra.figentra.com/
```

Every package installs at `0.1.0-next.<n>`, `latest` is absent (no 0.1.0 yet), and `npm audit signatures` in that
folder verifies the registry signatures against `/-/npm/v1/keys`. Then the products move to `@stackra/*-config@next`
and drop their `packages/tooling` copies, one follow-up batch per product.

## Not here yet

- A signed offline licence file for on-prem from the registry (ADR 0453 decision 15, `LICENCE_SIGNING_KEY`): the
  `keygen` driver of `@stackra/licensing` covers on-prem until it is built.
- Pruning old `licence_requests` receipts (they are small and kept).
- `@stackra/skills/contracts` (`StackraKind`, `StackraManifest`, `CatalogueItem`, `CataloguePage`): stackra-184. The
  same shapes live in `src/interfaces/` (`stackra-kind.type.ts`, `catalogue-item.interface.ts`, …) and
  `src/constants/stackra-kinds.constant.ts` until then.
- The runway placement of this member (the deploy is its own workflow, not a `runway-cloudflare-workers.yml` caller:
  that provider has no D1 migration step and no Worker secret), the Pulumi stack call of `registryWorker`, and the
  move of the custom domain from the npflared Worker (owner, ADR 0453 decision 17; runbook step 1).
