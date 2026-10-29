# @stackra/infra-cloudflare

## 0.1.0

### Minor Changes

- 58d9f32: Add `@stackra/infra-cloudflare`, the Cloudflare half of the core Pulumi stack (ADR 0171): `cloudflareCoreStack` and its
  parts declare the zones the root runway names (imported and protected) with their records, Worker custom domains and
  Cloudflare for SaaS fallback origin, the runway edge per plan (TLS, the managed WAF, bots, the per-IP rate limit and the
  API cache bypass), a named dev tunnel per machine, Access in front of the dev zone and the operator surfaces, and the R2
  buckets with the Turborepo cache's 7-day expiry; `.` checks the runway `edge` block and the stack config and plans the
  tunnel ingress and the rate-limit windows.
- 9b739b6: Add `registryWorker` to `./node` (ADR 0453): the Stackra registry Worker's protected R2 bucket and D1 database, its KV
  cache namespace and the `npm.stackra.figentra.com` Worker Custom Domain, with an optional import id to adopt the
  domain from the npflared Worker.
- 23b68af: Add the storefront edge (ADR 0402): `parseStorefront` for a tenant's campaign settings, a waiting room and event per
  campaign toggled by its `enabled` setting (`storefrontEdge`), per-shopper limits on hot items (`shopperLimitRules`)
  in the zone's rate-limit entry point, the `storefront` input of `cloudflareCoreStack`, and the
  `CloudflareHealthIndicatorDriver`.
- 1a4efc2: Provision the shared cache on GCP and Cloudflare. `gcpRuntimeConfig` reads `shared.cache` (`engine: valkey`, node
  type, shards, replicas, eviction, `auth`, `subnet`) and `gcpRuntime` creates a Memorystore for Valkey instance on the
  deployment's VPC over Private Service Connect, encrypted in transit, with IAM sign-in unless `auth: none`, and the
  VPC's `gcp-memorystore` connection policy when `subnet` is named; it exports `cacheInstance` and `cacheEndpoint`.
  `GcpRuntimeConfig` gains `cache` and `GcpRuntimeOutputs` gains `cacheInstance` and `cacheEndpoint`. In
  `@stackra/infra-cloudflare`, `workersCacheNamespaces(root)` names the Workers KV namespace of each environment whose
  default cache driver is `workers`, and `cloudflareCoreStack` declares them and returns them as `caches`.
- eb2628a: Add the login directory Worker's Cloudflare side (ADR 0451, STA-752): `loginDirectoryHandler` (identifier to regions by
  keyed hash over KV), `loginDirectoryKvRequest` (a region's KV bulk put and delete) and the `LoginDirectoryKv` and
  `LoginDirectoryOptions` types in `.`; `loginDirectoryWorker` (global KV namespace and routes) in `./node`.

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- a3d23d9: Rule-gap B-7 (stackra-234): `typescript/explicit-module-boundary-types` at error for packages; apps, workers, tools,
  build scripts, tests, stories and e2e specs are off.
  
  The other packages: no behaviour change. Exported functions and public class members now spell the return type they
  already had: components return `ReactElement` (or `ReactElement | null`), panel overrides their base's node type,
  Pulumi helpers an object type of their resources, and zod factories their schema type. `tableInput` keeps its inferred
  schema type with a reasoned disable.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [62c7ae1]
- Updated dependencies [37e1aa8]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [a1eb70f]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [3ccd0ab]
- Updated dependencies [769adee]
- Updated dependencies [4135a5a]
- Updated dependencies [c927e35]
- Updated dependencies [29c2d3e]
- Updated dependencies [2787c1e]
- Updated dependencies [8d304d6]
- Updated dependencies [e344058]
- Updated dependencies [a183131]
- Updated dependencies [fbf8fa4]
- Updated dependencies [4ea8dd0]
- Updated dependencies [3a5d71d]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
- Updated dependencies [d19a3d5]
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/runway@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
