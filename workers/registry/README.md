<!-- Stackra file contract. Purpose: the README of @figentra/worker-registry, the Stackra npm registry Worker: routes, storage, publishing, read rules, settings, layout and deploy. Boundary: documentation only; ADR 0453 is the decision. Runtime: documentation. Governing contract: ADR 0453; ADR 0284; ADR 0007. -->

# @figentra/worker-registry

The Stackra registry: one Cloudflare Worker (`stackra-registry`) at `https://npm.stackra.figentra.com/` that serves
every `@stackra/*` and `@stackra-pro/*` item (packages, skills, agents, MCP servers and plugins) over the subset of the
npm registry protocol that npm, pnpm and Yarn need
([ADR 0453](../../apps/docs/src/adr/0453-the-stackra-registry-one-npm-compatible-store-on-cloudflare-and-our-own-licence-engine.mdx)).
R2 holds the bytes, D1 the truth, KV the caches. It never proxies an upstream.

## Consumers

```ini
@stackra:registry=https://npm.stackra.figentra.com/
@stackra-pro:registry=https://npm.stackra.figentra.com/
//npm.stackra.figentra.com/:_authToken=${STACKRA_LICENCE_TOKEN}
```

`@stackra` reads need no token (a token sent is ignored). `@stackra-pro` reads need a licence token whose licence is
active, inside its dates plus the grace days, with a grant covering the name: no or unknown token is 401, anything
else refused is 403.

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
| `PUT /-/user/*`                                              | 403: there is no login, see the licence docs                    | —                          |
| `DELETE` of a package or version                             | 405: versions are immutable                                     | —                          |
| anything else (search, audit, unknown or unscoped names)     | 404                                                             | —                          |

The licence API (`/-/stackra/v1/licences`) is stackra-183's.

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
| `REGISTRY_LICENCE_MAX_TOKENS`     | `registry.licence.maxTokens`   | 20 (read by stackra-183)                      |
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
| `migrations/`             | numbered D1 migrations; `0001_registry.sql` seeds the scopes and trusted publishers      |
| `src/main.ts`             | the Worker entry: builds the dependencies, hands over to `handleRequest`                 |
| `src/http/`               | `parsePath`, `splitName`, the router, `json` and `failure`                               |
| `src/npm/`                | the npm read routes (`handle*`), packument rendering and its KV cache, R2 keys           |
| `src/publish/`            | publish and dist-tag writes, publish auth, tarball reader, digests, content checks       |
| `src/oidc/`               | GitHub OIDC verification, the key set, publisher matching, the token exchange            |
| `src/access/`             | the `LicenceCheck` port and its empty binding, the edge-cache wrapper, the read rule     |
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
(`.github/workflows/deploy-registry.yml`, GitHub environment `registry`; not written yet).

## Not here yet

- The licence engine (D1 tables, the licence API, the D1 `LicenceCheck` adapter): stackra-183. Until then
  `main.ts` binds `noLicences`, so every `@stackra-pro` read is refused.
- `@stackra/skills/contracts` (`StackraKind`, `StackraManifest`, `CatalogueItem`, `CataloguePage`): stackra-184. The
  same shapes live in `src/interfaces/` (`stackra-kind.type.ts`, `catalogue-item.interface.ts`, …) and
  `src/constants/stackra-kinds.constant.ts` until then.
- The deploy workflow, the runway placement, the real D1 and KV ids in `wrangler.jsonc`, and the move of the custom
  domain from the npflared Worker (owner, ADR 0453 decision 17).
