# @stackra/runway

## 0.7.0

### Patch Changes

- @stackra/app@0.7.0
  - @stackra/config@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/validation@0.7.0

## 0.6.1

### Patch Changes

- @stackra/config@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/validation@0.6.1
  - @stackra/app@0.6.1

## 0.6.0

### Minor Changes

- 67dac91: `stackra deploy --env <environment>` now refuses an environment whose root `runway.yaml` declares
  `deploy.approval` unless `--approved` is passed (as `stackra deploy --product` already does), so it ships only from
  the CI job behind the owner's approval (ADR 0468). A dry run still plans without it. It also runs Runway's `deploy()`
  inside `withDeployLock`, so two deploys of one environment never overlap on one host; the new `fileDeployLock(directory)`
  in `@stackra/runway/node` is that lock (a lease file renewed while the work runs; an ended lease is taken over). Across
  CI runners the caller workflow's `concurrency` group stays the lock (STA-1969).
- 0183006: `runway secrets sync <env> [--dry-run]` syncs each service's declared secrets from Infisical into its Encore Cloud
  environment with `encore secret set`, the value on stdin (STA-606). The sync prints names only, reads every value
  before it writes anything, refuses one Encore name with two values, and reads values only in a CI job; `--dry-run`
  reads nothing. `readMemberSecrets` (exported from `./node`, with `readRunways`, `secretSyncPlan`, `syncSecrets` and
  the `DeployRunways` and `SecretSyncEntry` types) returns one member's values in memory only, for the Workers provider's
  versions upload (STA-1990). A Worker's secrets stay with the Workers provider; EAS waits for STA-2009.
- a736fb5: The root runway's `edge`, `release`, `observability` and `providers.github` blocks are closed objects: a misspelt key
  or an out-of-range value now fails `parseRunway("root", …)` with its path instead of passing silently. Each mirrors
  its owner's keys and value rules (infra-cloudflare, infra-observability, infra-github) without defaults, and the
  owners still parse their own block. Both copies of the root JSON Schema carry the same shape.
- b74c373: The root runway's `targets` are typed: the nine destinations Runway knows (`encore-cloud`, `cloudflare-workers`,
  `aws-ecs`, `compose`, `helm`, `eas`, `electron-release`, `mintlify`, `npm`) are closed objects with the keys the
  repositories use, so a misspelt key such as `eas.ota.rolout` now fails `parseRunway` and the JSON Schema instead of
  passing silently; a secret value in `mintlify.adminKey` (a NAME) fails too. Any other destination name stays open, and
  each provider still parses its own settings. `schema/root.json` and the canonical `tools/schemas/runway-root.schema.json`
  carry the same shape (STA-1975).

### Patch Changes

- 2ed03e2: The 32 runway fields that the repositories set but nothing reads yet now say so in their JSON Schema description, with
  the work that will read them ("Not read yet (Runway plan PR 12, STA-2001)"); `environments.*.deploy.gate` is marked a
  deprecated alias of `release.gate`. No field is removed and parsing is unchanged. `@stackra/repo-checks` adds the
  `runway-unread-fields` structure check (`checkRunwayUnreadFields`, `RUNWAY_UNREAD_FIELDS`): it fails when the list and
  the schema notes disagree, or when the runway, CLI, gen or infra sources read a field still listed as not read.
- @stackra/config@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/validation@0.6.0
  - @stackra/app@0.6.0

## 0.5.1

### Patch Changes

- @stackra/app@0.5.1
  - @stackra/config@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Minor Changes

- f7321ea: Add the `cloudflare-workers` provider (STA-1921, ADR 0352 decision 1). `CloudflareWorkersProviderDriver` in
  `@stackra/runway/node` deploys every Worker member listed in `targets.cloudflare-workers.members` that ships under the
  target's kind. For each member it builds with turbo and puts the real binding ids (by environment variable name) into
  `wrangler.jsonc`, restoring the file afterwards. It then applies the D1 migrations and runs
  `wrangler deploy --message <sha>` with the named vars. Last, it sets the named secrets with `wrangler secret bulk`, on
  stdin only. `current` reads the commit back from `wrangler deployments list`, `verify` also checks each member's smoke
  URL, and `rollback` returns each member to its recorded version. `CommandRunner` takes an optional `input` for
  standard input, and `deploy()` takes an optional `kinds` filter.

### Patch Changes

- @stackra/app@0.5.0
  - @stackra/config@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/validation@0.5.0

## 0.4.0

### Minor Changes

- d065062: Add a local edge for a built web surface (STA-1676). `@stackra/runway`: `LocalEdgeKvDriver`, a file-backed
  `EdgeKvWriter`; `previewServe`, which writes the bundle's `release:` and the shell's `shell:` rows into it with every URL
  on its own origin and serves on 127.0.0.1 as the edge Worker does (the shell page with its import map and startup
  record, the bundle and shell files, and an API proxy for `/api` or given prefixes); `renderShellPage`; and `releaseOf`,
  now shared with `publishProduct`. `@stackra/cli`: `stackra preview serve --surface <key> [--port] [--api]
  [--api-prefix] [--region]`.

### Patch Changes

- 1a09488: Two surfaces whose hosts resolve to one name in an environment are refused as `host_collision`, naming the host, the
  environment and both surfaces: `checkHosts(root)`, applied by `parseRunway("root")` (so `stackra validate` and
  `runway plan` fail) and by `platformRows`, where the second surface used to overwrite the first one's edge KV row
  (STA-1796).
- d63eb09: `deployPlan` gives each member's runtime secrets their own folder, `<runtime path>/<member>` (for example
  `/runtime/web`), as ADR 0512 and ADR 0371 decision 3 require (STA-1867).
- 2e94f1e: The shell release row now carries the shell's own stylesheets (STA-1681): `shellReleaseOf` adds `css` from
  `dist/shell.json` as URLs on the asset store, so the edge Worker's page (and the local edge's) links them before the
  bundle's.
- Updated dependencies [0b660e0]
- Updated dependencies [9c8d108]
- Updated dependencies [3c30885]
- Updated dependencies [c9cf778]
- Updated dependencies [1856ee0]
- Updated dependencies [ca7d004]
- Updated dependencies [eccdaf0]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [ff56870]
- Updated dependencies [e219411]
  - @stackra/validation@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/container@0.4.0
  - @stackra/config@0.4.0
  - @stackra/app@0.4.0

## 0.3.0

### Minor Changes

- ae08e09: Add the `runway` binary (`plan`, `deploy`, `promote`, `--dry-run`), moved unchanged from the repository's
  `pnpm runway` script; `pnpm runway` is now its alias.
- 4ed7315: Add the smoke step after a preview deploy (STA-265): `smokePreview` checks every web surface at its canonical preview
  host and every mobile app on each platform it has a build for, through the `SmokeDriver` port, and throws
  `RunwaySmokeFailedError` with every result when one fails, so promotion is blocked; `only` keeps the targets one CI job checks. Drivers: `PlaywrightSmokeDriver`
  (the page loads, renders its first screen, raises no console or page error and no critical axe violation; Playwright
  and axe are optional peers from `catalog:e2e`), `MaestroSmokeDriver` (the mobile launch check) and the placeholder
  `ElectronSmokeDriver` for desktop. The mobile launch check: `launchCheckJob` installs a Release simulator build on
  the iOS simulator or the Android emulator and runs the template line's Maestro flows with the app's store id as
  `APP_ID`, writing a JUnit report and screenshots to `.stackra/launch-check/<app>/<platform>/`; `runLaunchCheck` runs
  that list and fails at the first failing flow. Defaults live in `LAUNCH_CHECK_DEFAULTS`. `easJsonOf` adds a
  `simulator` build profile, shared by the launch check and the capture job.
- d53babc: Add `resources` and `workloads` to the root runway, `environments.<env>.limits.monthly`, and `uses` on service runways
  (STA-1641, ADR 0493). A resource is `postgres` (RDS or Aurora, a major version), `queue`, `topic`, `cache` or `bucket`
  with a size per environment; Kafka, OpenSearch and SES are reserved and refused. A workload is a container pinned by
  digest with a port, health path, `internal` or `public` exposure, the resources it uses, public env, secret names, a
  size and task count per environment, and a required reason; a `uses` that names no resource is refused. Adds the
  `ResourceKind` and `ResourceSize` enums and the canonical schema copies.

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [d5b5411]
  - @stackra/app@0.3.0
  - @stackra/config@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Minor Changes

- 3e4c408: `capabilityConfig` now always lists `com.google.android.gms.permission.AD_ID` in `blockedPermissions`, so a build does
  not declare the advertising id that Play Services merges in. An app keeps it only by enabling a template capability
  (an ads or attribution flag) whose `android.permissions` lists it (STA-1577).
- a4b8844: Add mobile onboarding (STA-1623, ADR 0482). `@stackra/runway`: `onboardMobile` runs thirteen idempotent steps that take
  a product's mobile app from nothing to store-ready (store ids from the product key, EAS project, Apple bundle id and
  capabilities, Google Cloud project, Firebase apps and config files, Analytics link, Sentry project, EAS-managed signing,
  the FCM v1 key written blind to Infisical and handed to EAS, store key names, the Play app and its manual first upload),
  behind the new `AppleDeveloper`, `PlayConsole`, `ExpoProjects`, `GoogleCloud`, `Firebase`, `SentryProjects` and
  `VaultWriter` ports with real and memory drivers; `mobileIdsOf`, `easJsonOf`, `toolVersionOf`; the root runway's
  `mobile.<app>` gains `eas.owner`, `google` and `sentry`. The mobile job writes `eas.json` with the exact toolchain pins
  and copies the Firebase config files; `EasProviderDriver` gains `submit` and `platformOf`; `deployProduct` gains
  `mobileOnly` and holds an Android build back while Play has no release. `@stackra/cli`: `stackra mobile onboard
  [--app] [--check|--live]` and `stackra deploy --product --mobile-only`.
- d37c08f: Add `mobile.<app>.signIn.social`, the app's social sign-in providers. A non-empty list without `apple` is refused (App
  Store guideline 4.8), and with `apple` `expoConfigOf` sets `usesAppleSignIn` and the
  `com.apple.developer.applesignin` entitlement.

### Patch Changes

- Updated dependencies [20eea53]
- Updated dependencies [9085c41]
  - @stackra/app@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 62c7ae1: Pool budget wiring and a direct URL (ADR 0473, stackra-254). `DatabaseConfig.pool` (`max`, `min`, `idleTimeout`)
  sizes the pool of one instance and `PostgresDatabaseDriver.connect({ pool })` hands it to MikroORM for the primary and
  each replica. The generated boot passes it, with `DATABASE_POOL_MAX` over `max`; runway's `poolMaxOf` gives that share
  of the service's `poolBudget`. The migration and seed runners connect with `directDatabaseUrl()`
  (`DATABASE_DIRECT_URL`, else `DATABASE_URL`), so they never go through a transaction-mode proxy.
- 37e1aa8: Docs site target (stackra-176): gen assembles a docs app's Mintlify root into `.stackra/site` from a typed `DocsConfig`
  (pages in `src/docs`, assets in `src/assets`, snippets in `src/snippets`) with the `docs_*` refusals; `stackra
  dev|build|lint` run Mintlify in the generated site; runway's `MintlifyProviderDriver` (now a `Driver(RunwayProvider)`,
  so runway depends on `@stackra/container`) publishes it as an orphan commit to `targets.mintlify.branch`.
- a1eb70f: A product with no app members builds and deploys from its CI: `stackra build --product [--dry-run]` builds every
  surface's extension bundle against its shell line's import map and every mobile app's EAS build, and writes
  `dist/product/build.json`; `stackra deploy --product --env <environment>` publishes the bundles and host rows, lists
  the landing seeds, submits the mobile builds, and waits on the environment's approval (`--approved`). Runway adds
  `buildProduct`, `deployProduct`, `workspacePackages` and `exportSourceOf`; the mobile job takes `buildOnly` and `packages`.
- 3ccd0ab: `./node` gains the brand step and the store-screenshot capture job (ADR 0441 as amended, D17 and D19).
  `runBrandStep` runs `@stackra/brand-kit` in CI per web surface, per mobile app and per white-label scope, each under
  `.stackra/brand`, and `committedBrandOutputs` fails the step when a file a kit asset manifest lists is committed.
  `screenshotCaptureJob` defines the simulator capture of every captioned screen per locale with demo data, writing where
  the kit's store frames read, and `runScreenshotCapture` runs it on a Mac CI runner. Defaults live in
  `BRAND_STEP_SETTINGS` and `SCREENSHOT_CAPTURE_DEFAULTS`.
- 769adee: Add `withDeployLock(root, environment, lock, work, ttl?)`, the `DeployLock` type and `RunwayLockedError` (ADR 0435): one
  apply per environment at a time (a deploy, promotion, rollback or settings promotion) under the key
  `runway:deploy:<project>:<environment>`, held through the caller's `@stackra/locking` `Locks`; a held lock refuses at once.
- 4135a5a: Add the deploy path (ADR 0400): the `RunwayProvider` port with `deploy`, `promote` and `rollback` over `deployTargets`
  (kinds in build order, regions in release order, then dedicated tenants), the `EncoreCloudProviderDriver` and
  `EasProviderDriver` with `runCommand`, `RunwayDeployFailedError` and `DeployKind`; the root runway gains
  `environments.<env>.cloud` (replacing `providers.gcp.environments`) and `environments.<env>.dedicated`, which
  `checkRegions` checks, and `regionsOf` takes explicit region keys.
- 29c2d3e: `./node` gains the mobile job (ADR 0439): `runMobileJob(request)` builds one app of the root runway's `mobile` from a
  checkout of its OS template line, started by a merge or, with a `variant`, by an OS event for a scope (white-label).
  It checks the store accounts and the white-label mode, refuses a white-label build under the platform's Apple account
  until `<store>/apple-guidelines.json` records guidelines 4.2.6 and 4.3 as passed, writes the Expo `app.json` (runway
  identity, runtime version from the template line, EAS project) and `expo.autolinking.exclude`, and starts `eas build`
  through `EasProviderDriver`. `capabilityConfig(catalogue, flags)` turns the template's `capabilities.json` into the
  plugins to run and the modules, plugins, Info.plist keys, entitlements and Android permissions to strip, refusing a
  flag the line does not offer. New types `MobileApp`, `MobileCapability`, `ExpoPluginEntry`, `MobileCapabilityConfig`,
  `MobileStoreAccount`, `MobileVariant`, `MobileJobRequest`, `MobileJobResult`.
- 2787c1e: Add `@stackra/runway`, runway format version 3 (ADR 0296): the root, app and service runway schemas, which accept and
  refuse what the canonical `tools/schemas/runway-*.schema.json` do (member runways refuse every root key, a dedicated
  resource needs a reason, `requires` engines are `postgres`, `valkey`, `s3` and `sns-sqs`, a grouped topology needs
  groups); `parseRunway`, `checkPlacement` (every service member placed exactly once in a grouped environment),
  `runwayJsonSchema` and the shipped `schema/{root,app,service}.json`, byte copies of the canonical files; the readers
  `baseUrlOf`, `devPorts` and `updateFeed` over the resolved runway facts (`.stackra/dev/ports.json`, or the
  `__STACKRA_RUNWAY__` a bundle carries), folded in from the old `./ports` entry; and `./node` with `definesFor`,
  `devServer` (folded in from the old `./vite` entry) and `readRunway`.
- 8d304d6: Add preview databases per pull request (ADR 0238 decision 1). `previewDatabaseOf(root, branch)` reads
  `environments.preview.shared.database` (`from: seed-pack | branch`, `profile`, `branch: { provider: neon, project,
  parent }`): by default a fresh database seeded with `previewSeedStep` (`stackra seed-pack <product> --profile demo --env
  preview`); with `from: branch` a Neon branch `preview-<git branch>`. New `PreviewDatabaseBrancher` port and
  `PreviewDatabaseSource` enum in `.`, and `NeonPreviewDatabaseDriver` in `./node`, which creates, connects to and deletes
  the branch with `neonctl`.
- e344058: Add the edition sections of ADR 0335: the root runway's `product` (the product key and, for an edition, `edition.of`
  and its version range) and an app member's `brands` (key, name, tokens overlay path, app and bundle ids), in the zod
  schemas and the published JSON schemas. `definesFor` carries both into the bundle's facts, and `productOf()` and
  `brandsOf(member)` read them.
- a183131: `./node` gains the publish step (ADR 0436, 0437; app-shells 4.2, 5.3, 15.7, 16.3, 16.4, 16.7). `publishProduct`
  uploads each web surface's built extension bundle to R2, writes the platform `host:` rows (canonical host, D2) and the
  app-link `wellknown:` files, and starts a `canary:` on the internal and demo scopes (D6), or writes `release:` on a
  first release; it refuses a bundle whose `targets` the edge does not serve and an ops contribution without a second
  reviewer. `publishShell` puts a shell release on the `shell:<surface>:<line>` canary list; `promoteCanary` promotes,
  holds or rolls back a canary on its health (`canaryVerdict`: a timer alone never promotes);
  `checkShellCompatibility` builds every product against the next shell's import map. `WranglerEdgeKvDriver` and
  `EdgeKvConfig` write the edge KV copy; every threshold and window is in `EDGE_PUBLISH_SETTINGS`. Adds the
  `@stackra/app` dependency for the `EdgeKvWriter` port.
- fbf8fa4: Add the cloud and region dimensions of ADR 0354 to the root runway: a top-level `regions` map (each with its `cloud`,
  `aws` or `gcp`, cloud `location`, `account` and `jurisdiction`), `providers.gcp`, and an environment's `regions` in
  release order; `RunwayCloud`, `checkRegions` and `regionsOf`. The shipped `schema/root.json` carries the same change;
  copy it to `tools/schemas/runway-root.schema.json`.
- 4ea8dd0: The root runway gains `surfaces` (each web surface's shell line, preset, packages, hosts with one canonical, and a
  landing site's `content`; `ops` holds only a declarative `contributes`, so a component, entry, script or module-path
  block fails) and `mobile` (template line, packages, `assets` and `store` paths under `assets/`, identity, capability
  flags, tablet, store accounts, EAS project and per-tenant `whiteLabel`), ADR 0441 and 0439. `environments.dev.lanes`
  gains the repository index table (`repos`, no index shared) and `worktrees`; `checkPorts(root, members)` and `PortIssue`
  report every duplicate effective dev port across the lanes, naming both owners (STA-863). An app runway's
  `release.mobile.whiteLabel` takes `true` or the `whiteLabel` block. The shipped `schema/root.json` and `schema/app.json`
  carry the same change, byte-identical to `tools/schemas/runway-root.schema.json` and `runway-app.schema.json`.
- 3a5d71d: Add the template line step: `checkoutLine` resolves a root runway line (`os/mobile@3`) to the highest release of its
  package on the registry (`<scope>/<owner>-<name>@<major>.x.y`, ADR 0481) or a local checkout and unpacks it into a
  folder, optionally as a git checkout; `shellReleaseOf` answers a checked-out shell's edge release from its
  `dist/shell.json`. `runMobileJob` takes `line` to check the template out itself and commit the config it writes, and
  `sha` is optional then. `expoConfigOf` writes the enabled flags to `extra.capabilities`. Dry runs: `dryRunCommand`
  records every command and `DryRunEdgeKvDriver` keeps the KV rows in memory.
  `prepareMobileDev` prepares a product mobile app's local run: the template line checked out into
  `.stackra/mobile/<app>`, its config and capabilities written, the product packages' `./native` entries listed for the
  template and its installed `node_modules` linked.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- d19a3d5: The `encore-cloud` provider's verify reads `GET <origin>/readyz` after the branch check when the environment's (or
  region's) `encore` block names an `origin` (STA-1385): 200 is up, anything else or a failed request is down, never a
  throw. Without an origin it checks the branch only, as before. The HTTP client is the driver's `fetch` field.

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
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- c927e35: The root runway accepts a `providers.gcp.projects` entry as an object such as `{ id, number }` as well as a plain
  value or `ref:`, so a root runway can carry the project shape `@stackra/infra-gcp` checks (ADR 0401). The shipped
  `schema/root.json` carries the same change; copy it to `tools/schemas/runway-root.schema.json`.
- Updated dependencies [854d7a9]
- Updated dependencies [28aa224]
- Updated dependencies [c547718]
- Updated dependencies [1821909]
- Updated dependencies [99321e1]
- Updated dependencies [2787c1e]
- Updated dependencies [d72a734]
- Updated dependencies [1a7597c]
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
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [c526bed]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/app@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
