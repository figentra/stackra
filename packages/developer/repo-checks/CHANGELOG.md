# @stackra/repo-checks

## 0.32.0

### Patch Changes

- ba6eed7: `catalogEncoreVersion` now also reads pnpm's `catalogs.default` form of the default catalog, which is where fflow keeps its pin. Before this, `stackra encore:prepare` and the service check found no `encore.dev` version in such a repository. The top-level `catalog:` form still wins when a file has both.

## 0.31.0

### Patch Changes

- 2ba26cd: `checkouts.checkout_page.submit@1` is a reviewed anonymous surface. Figentra Pay's hosted page sends the payer's
  details and terms acceptance with the session's HMAC client token, checked as `load` checks it. A per-session bucket
  (10 a minute) bounds the calls, and a row lock binds the session once. The details reach payments in the call and are
  never stored; the acceptance's IP address and user agent come from the call, never from input.
- ebfd942: `runMobileJob` reads mobile `whiteLabel.entitlement`: a scope-started white-label build is refused unless the
  variant's new `entitlements` list holds it. The field leaves `RUNWAY_UNREAD_FIELDS` and its schema description no longer
  says "Not read yet".

## 0.30.0

### Minor Changes

- 5b064da: `stackra validate --repository` holds a service to what Encore needs at the member root: `dependencies.encore.dev` is the one allowed literal and must equal the default catalog's `encore.dev` (`catalog:` is refused), and its tsconfig carries `baseUrl` "." and `paths` equal to its package.json `imports`. A repository with services must gitignore `services/*/encore.app`. New exports: `checkEncoreService`, `catalogEncoreVersion`, `pathsOfImports`.

## 0.29.0

### Minor Changes

- 856207e: `stackra validate --repository` checks the skill and agent sources: a skill that teaches rejected technology (ADR 0227) without a reasoned allowance, and an agent that names a missing path, is told to run a command without Bash, sets
  an OpenCode `allow`, names the retired `sdlc` plugin, or is routed to OpenCode at a tier OpenCode does not run. These
  are the checks core's agents-sync script ran, moved here now that Flow projects `.agents/` (STA-2098 H6).
- 6f43cd8: `stackra constitution` writes `.flow/constitution.md` (the file Figentra Flow's `flow-*` commands read) from the docs
  laws, and `stackra validate --repository` reports it missing or out of date (`constitution`). It was rendered by core's
  agents-sync script, which retires now that Flow projects `.agents/` (STA-2098 H6).
  
  The stackra preset's workspace-layout rule and guard hint name the docs site as Fumadocs on a Worker (ADR 0514), not
  Mintlify.

## 0.28.0

No changes in this release.

## 0.27.0

No changes in this release.

## 0.26.0

### Patch Changes

- e9d32d7: `checkJsonConfigs` lets a test fixture under `__tests__/fixtures/` stay `.json`: it is a provider's own wire format, a
  recorded API answer the test parses exactly as the provider sends it. Product repos no longer fail `json-configs` on
  their connector fixtures.
- 15b5fd2: `checkouts.checkout_page.choose_method@1` is a reviewed anonymous surface: it binds the payer's method choice to an
  unguessable session id with a per-session rate limit, answers only the bound provider session's widget, and returns
  no data beyond that session.

## 0.25.0

### Patch Changes

- e997ead: Tenant isolation tests must run on real Postgres. PGlite, the memory database driver and the test container's
  superuser all skip row-level security, so a unit test that "tenant B cannot read tenant A" passes even when the
  policies are wrong.
  
  - `stackra validate --repository` has a new check, `isolation-tier`: a test that imports `assertRowSecurity` or
    `tenantIsolationOptions` from `@stackra/database/testing` or `@stackra/tenancy/testing` must be a `.int.test.ts`.
  - The tenancy rule gains point 8: an isolation test runs in `test:int` on Postgres, as the service role that cannot
    bypass row-level security, with each read inside `TenantIsolationService.withTenant`.
  - The preset ships the `security-tenancy-isolation-test` skill again, rewritten with a working example.

## 0.24.0

No changes in this release.

## 0.23.0

### Patch Changes

- 6edeee4: Peers no longer fork a product's install. pnpm gives a package one variant per set of resolved peers, so an optional
  peer one member installs and another does not split every dependent in two: a product with connectors (react-dom for
  their tests) and a pglite service resolved two copies of @stackra/integrations, whose classes then failed each other's
  checks. `@stackra/database`'s test-only packages (PGlite and its extensions, Faker, Testcontainers) are no longer peers:
  its testing entry loads them from the member running the tests, as their devDependencies. `react-dom` is a required peer
  of `@stackra/ui`, `@stackra/app` and `@stackra/notifications`. `stackra validate` refuses a test-only package as a
  library's peer and an optional `react-dom` (`forking-peers`).

## 0.22.0

### Patch Changes

- 157ddff: `checkouts.checkout_page.framers@1`, the edge's frame-ancestors callback for Figentra Pay's checkout (STA-2564), is a
  reviewed anonymous surface: it answers only the checkout's configured public embed origins and fails closed.
- 3a9a6be: `@stackra/integrations` is a peer of every library that uses its values (payments, webhooks, documents, notifications,
  pricing, achievements, loyalty-kit), no longer a dependency. As a dependency, pnpm resolved a second copy in a product,
  so a Connection's base and `makeConnection` came from different copies and every Stripe call failed with "StripeConnection
  was not loaded by a ConnectionStore". `stackra validate` refuses the mistake (`hosted-peers`, `HOSTED_PEER_PACKAGES`).

## 0.21.0

No changes in this release.

## 0.20.0

No changes in this release.

## 0.19.0

### Patch Changes

- b800ae4: An `@figentra-oss/*` member inside a product repository may carry its own open-source LICENSE instead of the root
  licence, because the registry's `@figentra-oss` scope refuses the commercial licence.
- 3aaf758: The neutral and stackra layouts allow a root `STATE.md` and `llms.txt`, which every repository now keeps (the repo's
  current state and its agent index), so `stackra validate` stops reporting them.
- 619099f: `checkYamlFlowMaps` reads every document of a multi-document YAML file, so a Maestro flow (its config, `---`, then
  its commands) validates. A service's `assets/defaults/*.json` stays JSON: it is imported as a JSON module, which
  takes no YAML and no comments.

## 0.18.1

No changes in this release.

## 0.18.0

No changes in this release.

## 0.17.2

No changes in this release.

## 0.17.1

No changes in this release.

## 0.17.0

### Patch Changes

- a32f323: The layout check reads package.json `stackra.layout.banned`: a repository lists retired names, and any path carrying one
  (in any case, outside `adr/` history) is a finding.

## 0.16.0

### Minor Changes

- 585f9de: `stackra validate --repository` checks the repository layout (ADR 0526): the root holds only its Flow preset's
  template entries, its member folders, `tools/` with a README and the extras package.json `stackra.layout.allow`
  declares with a reason; never a root `src/` or a `scripts/` or `bin/` folder, and no path named `figentra-flow`.
- 33c88a5: The structure phase refuses a public id prefix that models of two different apps or services share (ADR 0135).
  Each finding names both models and their files and suggests a prefix no member uses. Members hosting the same
  package model keep its prefix; a clash inside one member stays gen's `prefix_duplicate`.

### Patch Changes

- 31378e6: The layout check allows the agent surfaces `fflow sync` renders for every preset (`.mcp.yaml`,
  `opencode.jsonc`, `.opencode/`) in the neutral template too, so a neutral repository and a Stackra
  product on Flow 0.6.4 pass.

## 0.15.0

No changes in this release.

## 0.14.4

No changes in this release.

## 0.14.3

No changes in this release.

## 0.14.2

No changes in this release.

## 0.14.1

No changes in this release.

## 0.14.0

No changes in this release.

## 0.13.0

No changes in this release.

## 0.12.0

No changes in this release.

## 0.11.1

No changes in this release.

## 0.11.0

### Minor Changes

- 46951df: The root runway carries the estate figentra/infra derives from (ADR 0524): `environments.<env>.region` (`me`, `eu` or
  `ksa`), which `runway validate` and `stackra validate --repository` require on a product's staging and production;
  `providers.aws.budgets.monthlyUsd` (default 300) beside the open thresholds; and `providers.cloudflare.records`, the
  non-Worker DNS records (verification TXT, MX, CAA) under a declared zone, an MX with its priority and only A, AAAA and
  CNAME proxied. `providers.aws.region` and `providers.aws.accounts` are deprecated: `runway validate` warns, and they go
  in the next release. Runway exports `checkEnvironmentRegion`, `deprecatedFields` and `RegionKey`.

## 0.10.0

### Minor Changes

- 242ebe4: `checkDestinations(root)` refuses a destination or target block no driver serves (owner decision O8):
  destinations must be `encore-cloud`, `cloudflare-workers`, `eas` or `mintlify`, and target blocks one of
  those, `npm` or `electron-release` (the desktop feed origin builds read). `stackra validate` runs it on the
  root runway. Core's dev environment drops its `compose`, `vite-dev`, `expo-dev` and `mint-dev` lines.
- 0d65e3f: The `cloudflare-workers` provider now renders each Worker's wrangler config from `runway.yaml` before it deploys
  (ADR 0519, STA-1989): the member's `wrangler.jsonc` stays the code facts, and the merged operational settings (the
  base, the preset, `defaults`, the member and its `environments.<environment>` entry) are added in wrangler's keys.
  `renderWranglerConfig` is exported from `@stackra/runway`, and a member may now set `environments`. `stackra
  validate` refuses an operational key (`compatibility_date`, `workers_dev`, `observability`, `routes` and the rest) in
  a new member's `wrangler.jsonc`; the four existing Workers are listed until they deploy through the provider.

## 0.9.0

### Minor Changes

- ca1614e: `checkRequires(root, service)` reports each `valkey` entry of a service runway's `requires` that no environment's cache driver serves, at `requires.<name>`; `stackra validate` (`checkRunwayFiles`) now runs it for every service runway against the root (STA-2049).
- cbbe4e3: Add the `docs` registry kind (STA-1920, ADR 0514 decision 10). `StackraKind.Docs` is a product's content-only docs
  package, `@figentra/<product>-docs`: MDX pages and their Fumadocs `meta.json` in `content/`, plus assets, with no code.
  `STACKRA_MANIFEST_SCHEMA` accepts `{ "kind": "docs" }` with nothing more. `pnpm validate` places a docs package at the
  repository's `docs/`, asks for no tier, turbo.jsonc or tsconfig, requires `content/`, and treats it as UNLICENSED like
  an app. `stackra add` never installs one: the docs hub depends on it.
- 75e94ff: `stackra validate --repository` refuses a paid job (a macOS, Windows or larger runner, also through `strategy.matrix`; `eas build`; a device farm run) on a branch push, pull request or merge queue trigger, and, in a job with no `environment:`, a deploy credential in its env or a deploy variable or secret read in a step's env, `with:` or `run:` (rule `workflow-triggers`, `checkWorkflowTriggers`; STA-256, ADR 0166, 0167).

### Patch Changes

- 2aeaec8: `writeDevFacts(root, lane)` in `@stackra/runway/node` writes `.stackra/dev/ports.json`, the file `readDevFacts` reads: each member runway's dev url, port, host, https, TLS files and Electron dev ports with the lane offset applied. `stackra dev` calls it before the member tool starts (lane from `STACKRA_LANE`, default 0). The app runway's `environments.<env>.desktop.devtools` is now read, so it leaves `RUNWAY_UNREAD_FIELDS` and its "Not read yet" schema note.
- 93bb1e7: `buildProduct` writes a product's `surfaces.ops.contributes` as a declarative `ops` bundle (the contributions file and its manifest, targeting `ops@1`), and `publishProduct` uploads it and writes its canary or release row like any surface. The root runway schema no longer marks `surfaces.ops.contributes` and its fields "Not read yet", and the list of runway fields not yet read drops them.
- da0af20: The runway schema copy check now says to put the zod-derived text in the canonical `tools/schemas` file and copy it
  to runway's `schema/`, instead of only `cp`, which overwrote a correct copy with a stale canonical file.

## 0.8.0

### Patch Changes

- 67e7e8f: The runway schemas drop the fields that no repository set and nothing read (STA-2028), so each of these keys now
  fails `parseRunway` and `pnpm validate`:
  
  - root runway: `resources.<name>.reason` (ADR 0493's reason rule is the workloads');
  - app runway: `brands` (ADR 0335 puts brands in `stackra.config.ts`), `release.pwa` (ADR 0326 decision 6),
    `release.desktop.channels`, `release.desktop.signing` and `release.desktop.platforms` (ADR 0344 decision 7; they
    return with the desktop release job), `release.mobile.whiteLabel` (the root `mobile.<app>.whiteLabel` is the one
    read), and `release.mobile.profiles.<profile>.distribution`, `.developmentClient`, `.simulator`, `.androidApk` and
    `.autoIncrement` (`easJsonOf` sets them);
  - app runway environments: `aliases`, `e2e`, `pwa`, `desktop.rollout` and `mobile.devClient`.
  
  The app runway's `release.desktop`, `release.mobile`, each mobile profile and each environment's `desktop` and `mobile`
  blocks are now strict. `brandsOf`, the `Brand` type and the `brands` entry of the runway facts are removed with
  `brands`; nothing called them.
  
  Kept, marked "Not read yet" in their description and in repo-checks' `RUNWAY_UNREAD_FIELDS`: the
  `surfaces.ops.contributes` children (STA-2003), the app `health.path` and `health.expects` (Runway plan PR 13) and the
  app environments' `desktop.devtools` (STA-2029).

## 0.7.1

No changes in this release.

## 0.7.0

No changes in this release.

## 0.6.1

No changes in this release.

## 0.6.0

### Minor Changes

- e250d4f: Gen writes one `registerActions([...])` in each member's `#stackra/registrations`, a row per action and query with its
  locked key, permission, risk, effects and input schema, so the pipeline validates input and checks the permission of
  every call. `IamAccessControlDriver` now refuses a call with no registered permission instead of letting it through,
  and lets an anonymous caller past `require` and `authorize` only for a class whose `actors` list `anonymous`; the
  manifest marks such a call `anonymous: true` and its OpenAPI operation takes no security. `stackra validate` lists
  every anonymous-callable call, and a test pins today's five (STA-2025).
- 2ed03e2: The 32 runway fields that the repositories set but nothing reads yet now say so in their JSON Schema description, with
  the work that will read them ("Not read yet (Runway plan PR 12, STA-2001)"); `environments.*.deploy.gate` is marked a
  deprecated alias of `release.gate`. No field is removed and parsing is unchanged. `@stackra/repo-checks` adds the
  `runway-unread-fields` structure check (`checkRunwayUnreadFields`, `RUNWAY_UNREAD_FIELDS`): it fails when the list and
  the schema notes disagree, or when the runway, CLI, gen or infra sources read a field still listed as not read.

## 0.5.1

No changes in this release.

## 0.5.0

### Patch Changes

- 0263e54: `MUST_STAY_JSON` accepts the root `flow.config.json`, the name Figentra Flow reads its configuration by since 0.2.2
  (`fflow`), as well as the old `figentra-flow.config.json` (STA-1942).

## 0.4.0

### Minor Changes

- 1ba7227: `connectors` is a package category: one provider's Integration and Connection classes per package, `packages/connectors/<provider>`, tier lib. `CATEGORIES`, `StackraCategory`, the scaffold and the manifest schema accept it.
- c9cf778: Place the `approval-condition` kind in the `access` group (STA-1724, ADR 0509).
- 3ace90d: Add the read-only spec checks (STA-1669) as published code: `specFindings` runs the stage gate of every changed
  `.agents/specs/<prefix>-<n>-<slug>/` folder, the foreign-status, bug-lane and lane gates and the trace rules over injected
  git and file access, with the building blocks `specCheckStage`, `specCheckClarified`, `specCheckPlan`, `specCheckTasks`,
  `specCheckLane`, `specCheckForeignStatus`, `specCheckBug`, `specTrace`, `specTraceProblems`, `specDrift` and the parsers.
  The issue prefix is read from the repository's own spec folder names (`os-12-billing` is key `OS-12`), not fixed to one team.

### Patch Changes

- 3ce01cf: A package's entity list is a committed generated contract, `src/node/entities.gen.ts`, written by `stackra gen` and kept
  fresh by `stackra gen --check` (ADR 0294 R10 and ADR 0295, amended 2026-11-01, STA-1874). Each package's `./node` now
  ships its `<KEY>_ENTITIES` inlined in the build instead of importing the gitignored `.stackra/gen/entities/` at runtime,
  which failed: the 0.3.0 builds of these packages carry that broken import until this release. `stackra validate`
  expects the re-export from `#node/entities.gen`, and the doc standard skips `*.gen.ts` files.
- aa21e6b: Gen reads a consumed service from a sibling folder or from a dependency whose `package.json` has `stackra.kind`
  `contract` (a producer's published `stackra.manifest.json`, OpenAPI and lang, no source) and whose manifest `member` is
  the service, never by matching a dependency's member name, which could pick a package's manifest for a service of the
  same name. A contract package is never hosted. Its client and lang are generated; a listener of its events is refused
  with `client_event_remote_transport` until the event-transport ADR. `StackraKind` gains `contract` (a new kind, so
  skills is minor); `stackra add` does not offer it; repo-checks asks a contract package only for its kind and manifest.
- e4383ce: The config phase refuses a file under a `__golden__` folder that git would ignore (`checkIgnoredGoldens`), so a golden can no longer go uncommitted.
- e457ad6: `json-configs` allows the lines tool's `tools/lines/{expected,fixture}/*.json`, an app's `capabilities.json` (Runway's
  `capabilityConfig`) and a worker's `edge.json`, each read as strict JSON (STA-1794).
- d4ae604: `stackra validate` no longer asks to convert seed data under `assets/seeds/**/*.json` to YAML: the seeders read it as
  JSON, so it joins `MUST_STAY_JSON`.
- 3bda222: `checkToolPins` and the `tool-pins` finding of the `config` phase: every `"npm:<name>" = "<version>"` pin in `mise.toml`
  must match a `pnpm-workspace.yaml` catalog pin, so the commit hooks' oxlint and oxfmt run the members' versions
  (STA-1865).

## 0.3.0

### Minor Changes

- 7a2d4cc: Add `checkAdrNumbers` and the `adr-numbers` rule in the config phase (STA-1732): when a repository keeps
  `apps/docs/adr/numbers.yaml`, every `NNNN-<slug>.mdx` ADR page must have its number registered there with the
  same slug, and no number may be used twice.

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- b369e36: `MUST_STAY_JSON` accepts the root `figentra-flow.config.json`: Figentra Flow reads its configuration by that fixed name
  as strict JSON (ADR 0503).
- 3e7699f: `json-configs` allows the committed `openapi.json` gen writes at each member root (ADR 0294 R10), and a product repo's
  flat `assets/lang/<locale>.json` beside the `assets/lang/<locale>/<namespace>.json` form (STA-1737).

## 0.2.0

### Minor Changes

- 32bec80: `checkDocFile` now also requires a TSDoc block on symbols exported through a local `export { … }` list or
  `export default name`, on `export default <expr>`, and on each member of an `enum` or const-object enum (`Enum.of({ … })`
  or a literal-valued `{ … } as const`; a one-word label is enough there). `isDocScoped` now covers `.mts` and `.cts`
  sources.
- c4f295e: <!-- Purpose: release note for the HeroUI Pro removal: no member may depend on HeroUI Pro. Boundary: changelog text only. Runtime: none. Governing contract: ADR 0469. -->
  
  `checkMember` refuses HeroUI Pro (`PRO_DEPENDENCIES`: `@heroui-pro/react`, `heroui-native-pro`) in every member, apps
  included: Stackra ships free HeroUI and its own components only (ADR 0469).

### Patch Changes

- 2f56702: `stackra validate` accepts a product root's `brand.json`: the brand CLI (`figentra-brand pull`) reads and writes it as
  strict JSON, so it joins `MUST_STAY_JSON` instead of failing the config check in every product.
- dcde851: In a product repository, validate no longer applies the Stackra repository's own member rules: the package names by
  placement, the MIT licence, `sideEffects: false`, the stackra `repository` and `publishConfig`, and the brand NOTICE.
  A v3 service needs `stackra.config.ts` but no root module file, which v3.1 R12 writes only when it says something.

## 0.1.0

### Minor Changes

- 6a03936: Member metadata for people and agents (ADR 0453 decision 11, amendment of 2026-10-27, STA-1072). `@stackra/skills`
  adds the `package` kind's `tier`, `category`, `runtimes` and `summary` to `StackraManifest` and
  `STACKRA_MANIFEST_SCHEMA`, with the vocabularies `StackraTier`, `StackraCategory` and `StackraRuntime`.
  `@stackra/repo-checks` adds `checkMemberMetadata` (keywords, repository, homepage, bugs, author, engines, the `stackra`
  field against the folder and its turbo tags), `npmMetadataFor`, `turboTagsFor` and `MEMBER_METADATA`, run by the
  `structure` phase in the Stackra repository. `stackra new` writes the field, the tags and `--summary`.
- 954bf08: Enforce the ORM boundary and the raw SQL reason (gap mo23, ADR 0097 amendment of 2026-10-29). `boundaries.jsonc`
  bans `@mikro-orm/*` imports outside `@stackra/database`; `@stackra/model` may take `Collection`, `Ref` and `Reference`
  from `@mikro-orm/core`, and its ORM adapters the rest. `checkRawSql` (rule `raw-sql` in the structure phase) holds
  every raw SQL call in member source to a `// raw-sql:` reason (ADR 0160), with `RAW_SQL_BASELINE` as a ratchet for
  the calls that had none.
- 512884e: <!-- Purpose: release note for stackra-189: the Pro dependency rule after @stackra-pro/ui left figentra/stackra. Boundary: changelog text only. Runtime: none. Governing contract: ADR 0461 (decision 3), ADR 0310. -->
  
  No member of figentra/stackra may depend on an `@stackra-pro/*` package, apps included (`PRO_SCOPE`, ADR 0461):
  `@stackra-pro/ui` moved to figentra/stackra-pro. HeroUI Pro (`PRO_DEPENDENCIES`: `@heroui-pro/react`,
  `heroui-native-pro`) stays apps-only. The Pro wrapper's Keygen publishing check and the `PRO_WRAPPER` export are
  removed, `expectedName` no longer maps `packages/design-system/ui-pro` to `@stackra-pro/ui`, and
  `SEVEN_LANGUAGE_MEMBERS` drops `packages/design-system/ui-pro`.

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- 830ea4a: New `@stackra/native-customer-display` (ADR 0478): the `StackraCustomerDisplay` Expo module (an Android `Presentation`
  and an iPad external-display scene, moved unchanged from the mobile app's `src/native-sources/customer-display/`) with
  `ExternalCustomerDisplayDriver` behind the unchanged `CustomerDisplay` port, and its config plugin. `@stackra/peripherals`:
  `ExternalCustomerDisplayDriver` leaves the `.` entry for the new package (same driver name `external`); import it from
  `@stackra/native-customer-display`. `@stackra/repo-checks`: `checkNativeModules` no longer exempts the mobile app's
  customer display (STA-1533).
- de58cb5: `checkGitignore` accepts `**/.stackra/*`, the line that ignores the generated folder in every member.
- 3047b44: json-configs allows a product's `assets/landing/*.json` page documents: `stackra dev` seeds the os/landing shell
  with the content folder's `.json` files, so they stay JSON like lang catalogues.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.

Written by Changesets on release; never edited by hand.
