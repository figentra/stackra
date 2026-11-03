# @stackra/cli

## 0.7.1

### Patch Changes

- Updated dependencies [448c52f]
  - @stackra/gen@0.7.1
  - @stackra/runway@0.7.1
  - @stackra/mcp@0.7.1
  - @stackra/console@0.7.1
  - @stackra/repo-checks@0.7.1
  - @stackra/skills@0.7.1
  - @stackra/config@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/support@0.7.1
  - @stackra/validation@0.7.1

## 0.7.0

### Minor Changes

- 6afc362: `stackra testbed` works across an ordered list of enabled regions (`--regions a,b`, `STACKRA_TESTBED_REGIONS`, default `eu-west-1`; `--region r` narrows to one). `run` takes a free slot in the first region that has one, else raises the group in the first region with room, else waits (or exits 73 with `--no-wait`, 75 when no box is healthy), and every box is reached through its own region. `run --json` streams the job to stderr and prints one result line on stdout; `status` and `status --json` list every enabled region with its free, total and startable heavy and light slots and mark an unreachable one; `scale` and `unlock` take `--region`, defaulting to the region of the box they name.

### Patch Changes

- @stackra/runway@0.7.0
  - @stackra/mcp@0.7.0
  - @stackra/console@0.7.0
  - @stackra/gen@0.7.0
  - @stackra/repo-checks@0.7.0
  - @stackra/skills@0.7.0
  - @stackra/config@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/support@0.7.0
  - @stackra/validation@0.7.0

## 0.6.1

### Patch Changes

- dd1304c: `stackra testbed run` uploads `.agents` with the project, since `pnpm validate` reads its specs, hooks, rules and
  skills; `.git` is left out (the box makes its own snapshot), as `ci-box` did.
- @stackra/console@0.6.1
  - @stackra/gen@0.6.1
  - @stackra/mcp@0.6.1
  - @stackra/repo-checks@0.6.1
  - @stackra/runway@0.6.1
  - @stackra/skills@0.6.1
  - @stackra/config@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/support@0.6.1
  - @stackra/validation@0.6.1

## 0.6.0

### Minor Changes

- 941ae6b: `stackra doctor` checks the machine for what the workspace needs: mise tools, a running Docker engine, the network
  (each address of each host on port 443, flagging edges that drop while sibling addresses answer, with a Cloudflare
  WARP hint), the `@stackra` registry (and `@figentra` when used), GitHub, Encore, Pulumi, disk, free dev ports, and
  Xcode with a simulator only for a mobile member. `--fix` offers each fix and runs it after a yes. `stackra dev` runs
  the quick checks first and stops early with the fix when the machine is not ready.
- e15d9c3: Gen records every panel resource in the manifest's `ui.resources`, under `<module>.<model>`: the tree its builder
  members return, with its owning `module`, its `class` and, in a package, the `from` a host imports it from. Action
  and query classes in the tree are written as their locked keys, and a service or app also lists its hosted packages'
  resources. `generate` takes a `loader` to run the resource classes; `stackra gen` passes one on Vite's module runner,
  and a run without one refuses a member that declares a resource (`resource_loader_missing`). New refusals:
  `resource_unloadable`, `builder_impure`, `resource_operation_unknown` and `resource_duplicate` (STA-1947). The loyalty
  kit's manifest now records its `LoyaltyAccountResource`.
- 67dac91: `stackra deploy --env <environment>` now refuses an environment whose root `runway.yaml` declares
  `deploy.approval` unless `--approved` is passed (as `stackra deploy --product` already does), so it ships only from
  the CI job behind the owner's approval (ADR 0468). A dry run still plans without it. It also runs Runway's `deploy()`
  inside `withDeployLock`, so two deploys of one environment never overlap on one host; the new `fileDeployLock(directory)`
  in `@stackra/runway/node` is that lock (a lease file renewed while the work runs; an ended lease is taken over). Across
  CI runners the caller workflow's `concurrency` group stays the lock (STA-1969).
- 48c074c: `stackra deploy --env <environment>` is now the one command for a product repository: when the root `runway.yaml`
  declares `surfaces` or `mobile`, its `web` and `mobile` kinds run the product publish (the edge KV rows, the R2
  uploads and the EAS submits that `stackra deploy --product` runs), scoped by `--kind`, and every other kind
  (services, desktop, docs) goes through Runway's `deploy()`, under the same approval check and deploy lock. The product
  publish flags (`--assets-bucket`, `--served`, `--region` and the rest) pass through. A failed product publish stops
  the run before the other kinds. `stackra deploy --product` stays as the alias products' CI already calls (STA-1972).
- 4fcb66d: `stackra create <directory>` makes a new Stackra app in an empty folder: the banner, then the name, npm scope, edition
  and package manager (each also a flag; `--yes` takes the defaults), the `@stackra/starter` profile from the Stackra
  registry (or `--starter <dir|tgz>`), the doctor's checks for what the profile needs, then install, `stackra gen` shown
  as a tree of what it wrote, type-check, tests and the first commit. `@stackra/console/node` exports `tarballSpecs`.
- 2993840: `stackra testbed` reaches the boxes by SSH through SSM Session Manager: `ssh` and `rsync` connect to
  `ubuntu@<instance-id>` with an `AWS-StartSSHSession` `ProxyCommand`, so the security group needs no inbound rule and
  a changing public IP (Cloudflare WARP) no longer breaks access. `--ssh-direct` (or `STACKRA_TESTBED_SSH_DIRECT=1`)
  keeps the public-IP path with the port-22 allowlist swap. `awsTestbed`'s `allowedCidrs` is optional: absent or empty
  means no ingress. The Session Manager plugin is pinned in `mise.toml`.

### Patch Changes

- e047d03: `stackra testbed run` starts a box when the slot's group is at 0 and no box is healthy (desired 0 → 1), instead of
  waiting for a box that never comes; with `--no-wait` it still exits 75 after raising it, so the next run finds the box.
- 1677615: `stackra validate` findings in `@stackra/console` (STA-1966):
  
  - `CommandClass` takes `never[]` collaborators, so the `no-explicit-any` disable is gone.
  - `AGENTS.md` gains its PII section.
  - The `create` template's NodeNext imports keep their `.ts` extension without tripping ADR 0233's rule.
  - knip sees the `stackra-console` bin entry (STA-1985).
  - `@stackra/cli`'s duplicate-export check allows console's `Spinner`, `STACKRA_THEME`, `findCommand`, `runCommand` and
    `shapeArabic`, each with its reason.
- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [2256bf6]
- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [f0478cd]
- Updated dependencies [0090b9c]
- Updated dependencies [b98f7ea]
- Updated dependencies [71bbf08]
- Updated dependencies [99750d4]
- Updated dependencies [e15d9c3]
- Updated dependencies [e250d4f]
- Updated dependencies [67dac91]
- Updated dependencies [0183006]
- Updated dependencies [a736fb5]
- Updated dependencies [b74c373]
- Updated dependencies [2ed03e2]
- Updated dependencies [4fcb66d]
  - @stackra/console@0.6.0
  - @stackra/mcp@0.6.0
  - @stackra/gen@0.6.0
  - @stackra/repo-checks@0.6.0
  - @stackra/runway@0.6.0
  - @stackra/skills@0.6.0
  - @stackra/config@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/support@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- @stackra/runway@0.5.1
  - @stackra/mcp@0.5.1
  - @stackra/gen@0.5.1
  - @stackra/repo-checks@0.5.1
  - @stackra/skills@0.5.1
  - @stackra/config@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/support@0.5.1

## 0.5.0

### Minor Changes

- f7321ea: `stackra deploy --env <environment> [--kind <k,…>] [--member <key,…>] [--sha <sha>] [--dry-run]`, without
  `--product`, ships a commit (`HEAD` by default) to every target of the environment in the root `runway.yaml`, through
  runway's `deploy()` with the `encore-cloud`, `eas`, `mintlify` and `cloudflare-workers` providers (STA-1921). A dry run
  prints each target's plan. `--product` keeps the product deploy.

### Patch Changes

- Updated dependencies [0263e54]
- Updated dependencies [f7321ea]
  - @stackra/repo-checks@0.5.0
  - @stackra/runway@0.5.0
  - @stackra/mcp@0.5.0
  - @stackra/gen@0.5.0
  - @stackra/skills@0.5.0
  - @stackra/config@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/support@0.5.0

## 0.4.0

### Minor Changes

- 9ba62fd: `stackra check` has a `hooks` phase after `lint`: it compiles each `.tsx` file in a component home (class components
  become the function components gen emits) and runs oxlint's `react/rules-of-hooks` on the result, reporting each
  finding at the source file and line. The repository lint has that rule off in those homes, so this closes the gap.
- 97ab70b: Add `stackra consumer-gate --core <dir> --checkout <dir> --product <name> --out <dir> [--mode link|pack]` (STA-1813,
  ADR 0500), the product gate on every core train, moved from `tools/scripts/product-gate.mjs`: it points core at a
  scratch copy of a pinned consumer product (`link:` rows, or `--mode pack` with `file:` tarballs of every publishable
  package and a `leak` check that is never allow-listed), runs gen, typecheck, lint, build, test, `test:int` and the
  repo-own format, spell and validate steps, and writes JSON and markdown summaries keyed by product and pin, with an
  environment record and a `reproduce` command. The core tree must be built first and is never written. The matrix
  (`tools/consumer-gate/matrix.yaml`, a `pins` commit per service allowed, a `kind: scaffold` entry not yet run) and the
  allow-list (each entry has a `class`; `security`, `tenant-isolation`, `data-integrity` and `leak` are refused) are the
  repository's data. Exit 0 green, 1 red, 2 setup error.
- 2d76fe8: `stackra dev --tunnel` runs the developer machine's Cloudflare Tunnel beside any dev mode (STA-1909, ADR 0290 decisions 4
  and 5). It starts `cloudflared tunnel run` and stops it when the dev run ends. The token is `CLOUDFLARE_TUNNEL_TOKEN`,
  injected by `infisical run --env=dev --path=/agents`; it reaches `cloudflared` only as `TUNNEL_TOKEN` in that process's
  environment, never on its command line, and the member's dev processes do not inherit it. Without the token the command
  stops with a usage error. The tunnel (`figentra-<dev>`) and its hosts (`<member>-<dev>.figentra.cloud`) are made in
  Cloudflare; the CLI passes no ingress config.
- 7dc644e: `stackra new service` is the one service scaffolder (ADR 0500 decision 4). It writes the root module
  `src/<name>.module.ts` and one passing `createTestingModule` test beside today's files, and no tool config, so
  `pnpm install`, `stackra gen` and `stackra test` pass with no hand edit. `--data` adds the database test peers,
  `@stackra/testing`, an example module (model, migration, a PGlite unit test and one `.int.test.ts`) and a `test:int`
  script. `--repo <path>` names the workspace for every kind; a service written into a folder with no
  `pnpm-workspace.yaml` also gets a minimal workspace root (catalogs, `stackra` pinned to the CLI's version, an
  `.npmrc` for the Stackra registry). `--over` never writes or diffs under `src/`. `stackra test --tier int` runs the
  integration tier of a package or service. The old `tools/scaffold` service template and its `service` kind are
  removed.
- 580b554: The `spec` phase of `stackra check` runs the spec checks of `@stackra/repo-checks` in any repository that has
  `.agents/specs` (STA-1669), instead of calling `tools/scripts/spec-gate.mjs` and `spec-trace.mjs`, so product repositories
  check their specs too. A repository without `.agents/specs` reports the phase as skipped (no specs). `--base`,
  `STACKRA_BRANCH` and `SPEC_GATE_REQUIRE_READY=1` work as before.
- 9c8d108: Packages contribute console commands, and gen collects them per member (STA-1731). `@stackra/console` audits a
  command declared `audit: true` through the `CommandAudit` port (refused before it runs when no sink is ready; secret
  values redacted). gen records commands in the manifest, merges hosted packages' commands, refuses
  `command_collision`, and writes `#stackra/commands` and a console entry that `stackra console <member>` runs. First
  commands: `db:migrate`, `db:rollback`, `db:status`, `db:seed`, `tenant:list`, `tenant:create` (with a
  `TenantDirectory` port), `cache:clear` (the `Cache` port gains `flush`), `queue:work`, `queue:failed` and
  `queue:retry`; `@stackra/access-log` stores command audit entries (`STACKRA_COMMAND_AUDIT_SCOPE`).
- 1c22c33: `stackra db seed` runs a service's seeders: gen writes `.stackra/entry/seed.ts` (boot, direct database url, no relay loop), `runSeeders` runs `minimal` then the profile, each seeder built by the container in its own transaction with a seed ledger row, skipping a seeder whose source is unchanged (`--again` re-runs). Production refuses `demo`, `test` and `--again` without `--allow-production` and records who ran it. `stackra seed-pack` runs the same step after its records. A service's `boot` takes `url` and `relay` options.
- d065062: Add a local edge for a built web surface (STA-1676). `@stackra/runway`: `LocalEdgeKvDriver`, a file-backed
  `EdgeKvWriter`; `previewServe`, which writes the bundle's `release:` and the shell's `shell:` rows into it with every URL
  on its own origin and serves on 127.0.0.1 as the edge Worker does (the shell page with its import map and startup
  record, the bundle and shell files, and an API proxy for `/api` or given prefixes); `renderShellPage`; and `releaseOf`,
  now shared with `publishProduct`. `@stackra/cli`: `stackra preview serve --surface <key> [--port] [--api]
  [--api-prefix] [--region]`.

### Patch Changes

- d675b4d: `stackra db diff [--json]` compares the member's models with the schema its compiled migrations build, with no
  database and no network. It prints `<module>  <table>  <kind>  <subject>  <expected>  <actual>` per difference (or a
  JSON array) and exits 0 when they agree, 1 on a difference, and 2 when a migration does not compile or replay, or
  `@stackra/database` or PGlite is not installed in the member.
- 2687052: `stackra doctor` no longer checks a spec-kit `specify` pin: Figentra Flow replaced spec-kit (ADR 0510, STA-1850).
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
- bc2c53e: `@stackra/access-log` and `@stackra/achievements` export `./assets/*`, so a host's generated i18n can import their
  `assets/lang` catalogues (TS2307 before). `stackra validate --repository` refuses a package with `assets/lang/` that
  does not export `./assets/*` or leaves `assets` out of `files` (STA-1798).
- 36dbd49: Each package with models of its own exports `<MEMBER>_ENTITIES` from `./node`, which a hosting service's generated
  `registrations.ts` imports to register the package's entities; without it the service failed with TS2305 (STA-1793). `stackra validate --repository` refuses a package with own
  models whose stand-in `./node` barrel misses it.
- 0c16187: Fix the testbed's first apply. The launch template is now declared only with the groups, because EC2 refuses a template whose AMI parameter does not exist yet. The AMI parameter moves to `/imagebuilder/stackra-testbed/ami`, the only prefix Image Builder's service-linked role may write. Boxes get the `academorix-ci` key pair that `stackra testbed` connects with. The image steps and the box agent now find the host's mise tools in `/opt/mise`. `stackra testbed` now swaps its SSH allowlist entry with `aws ec2 …-security-group-ingress` (the `ec2` was missing, so a changed IP was never allowed).
- Updated dependencies [0b660e0]
- Updated dependencies [3ce01cf]
- Updated dependencies [1ba7227]
- Updated dependencies [9c8d108]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [1c22c33]
- Updated dependencies [ff56870]
- Updated dependencies [c9cf778]
- Updated dependencies [b99d4af]
- Updated dependencies [b531c97]
- Updated dependencies [0cf32d7]
- Updated dependencies [457b107]
- Updated dependencies [4561f10]
- Updated dependencies [823d985]
- Updated dependencies [d675b4d]
- Updated dependencies [ca7d004]
- Updated dependencies [1856ee0]
- Updated dependencies [d0b1ef3]
- Updated dependencies [3400ff6]
- Updated dependencies [13b7dff]
- Updated dependencies [aa21e6b]
- Updated dependencies [dbb60dc]
- Updated dependencies [bb08f25]
- Updated dependencies [5f63e58]
- Updated dependencies [c9cf778]
- Updated dependencies [e4383ce]
- Updated dependencies [e457ad6]
- Updated dependencies [d4ae604]
- Updated dependencies [3ace90d]
- Updated dependencies [3bda222]
- Updated dependencies [1a09488]
- Updated dependencies [d065062]
- Updated dependencies [d63eb09]
- Updated dependencies [2e94f1e]
- Updated dependencies [58c7da9]
  - @stackra/gen@0.4.0
  - @stackra/repo-checks@0.4.0
  - @stackra/skills@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/runway@0.4.0
  - @stackra/support@0.4.0
  - @stackra/config@0.4.0
  - @stackra/mcp@0.4.0

## 0.3.0

### Minor Changes

- 7f93c10: Add `stackra smoke --env <environment> [--only web,mobile,desktop] [--app <key> --ios <.app> --android <.apk>
  --template-dir <dir>]` (STA-265): runs Runway's smoke step after a preview deploy, prints one line per result with its
  problems and evidence, and exits 1 when any subject failed, so a promote job that needs it does not run. Runway's
  reusable `runway-smoke.yml` runs it per runner: web on Linux, iOS on the Mac runner, Android on an emulator.
- 5602e63: Add `stackra testbed <verb>` (STA-1626, ADR 0484), the replacement of the Mac script `ci-box`: `run "<session> <what>"
  <dir> "<cmd>"` runs heavy work on a free shared test box (claim, rsync, run under the slot's lock, another box on exit
  75, one retry of a light job after a lost box, the group's desired count raised after two busy minutes), plus
  `status`, `unlock`, `ip`, `ssh`, `sync`, `scale` and `image`. With no healthy box, `run --preset
  verify|e2e|integration --ref <ref>` dispatches the GitHub fallback workflow; `--no-wait` exits 75 instead of waiting.

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [23e556c]
- Updated dependencies [d0569d2]
- Updated dependencies [4bdb23b]
- Updated dependencies [ccc0b0f]
- Updated dependencies [d05f876]
- Updated dependencies [c9296d9]
- Updated dependencies [8dead7a]
- Updated dependencies [499effb]
- Updated dependencies [7a2d4cc]
- Updated dependencies [b369e36]
- Updated dependencies [3e7699f]
- Updated dependencies [ae08e09]
- Updated dependencies [4ed7315]
- Updated dependencies [d53babc]
  - @stackra/config@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/gen@0.3.0
  - @stackra/mcp@0.3.0
  - @stackra/repo-checks@0.3.0
  - @stackra/runway@0.3.0
  - @stackra/skills@0.3.0
  - @stackra/support@0.3.0

## 0.2.0

### Minor Changes

- 5fa1a15: Add `stackra ops bootstrap-operator --email <email> [--role] [--env] [--api] [--dry-run]` (STA-1586): calls the
  environment's own `identity.operator.bootstrap@1` on the API origin from the root `runway.yaml` (or `--api`) with the
  bootstrap token in `STACKRA_OPS_TOKEN`, prints granted, already holds or would grant, and exits 1 when no user has the
  email. No database shell or connection.
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

### Patch Changes

- ef51e46: `stackra build` in a service says there is nothing to build (Encore builds it at deploy) and exits 0, so a product's
  root `pnpm build` passes.
  
  `stackra build` in a package runs plain `tsdown` from the member root, which loads the generated config through the root
  shim gen writes, instead of `tsdown --config .stackra/tsdown.config.ts`.
- Updated dependencies [2f56702]
- Updated dependencies [9a2a6b0]
- Updated dependencies [bab9fe1]
- Updated dependencies [9085c41]
- Updated dependencies [32bec80]
- Updated dependencies [c4f295e]
- Updated dependencies [dcde851]
- Updated dependencies [3e4c408]
- Updated dependencies [a4b8844]
- Updated dependencies [d37c08f]
  - @stackra/repo-checks@0.2.0
  - @stackra/gen@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/runway@0.2.0
  - @stackra/mcp@0.2.0
  - @stackra/skills@0.2.0
  - @stackra/config@0.2.0
  - @stackra/support@0.2.0

## 0.1.0

### Minor Changes

- 55e2558: Add `stackra add <kind> <name>[@version]` (ADR 0453, STA-1336): resolves the item in the Stackra registry catalogue
  (`@stackra`, then `@stackra-pro`), checks its tarball's integrity, installs a skill, agent, MCP server or plugin into
  its target (a package through `pnpm add`) and pins it in `stackra-items.lock.yaml`. Add `stackra publish`, which
  checks `stackra.kind` and the `@<scope>/<kind>-<name>` name before `pnpm publish` to the registry. The registry origin
  is a setting (`--registry`, `STACKRA_REGISTRY`, the workspace `.npmrc`, default `https://npm.stackra.figentra.com/`).
  New dependency: `@stackra/skills`.
- 3c548d9: Add `stackra audit:verify <bundle.jsonl> [--key <keys.json>]`, the offline check of an audit proof bundle: every link
  rehashes to its hash and follows the one before, and every checkpoint is ES256-signed by a trusted key and matches its
  link (ADR 0212 decision 3, ADR 0416). Seed packs may now hold `fee-schedule`, `rate-card` and `checklist-template`
  records (ADR 0391, RV-22).
- e344058: Add `stackra db migrate` (applies the member's pending migrations in order, the release step) and `stackra db rollback`
  (reverts the last batch; refused unless the target is a dev, preview or test database). Both run in the member's context
  through its own `@stackra/database/node`, imported dynamically, so the CLI does not bundle MikroORM.
- 640c0dd: `stackra new package|service` names the member from `--scope` (a product key or `@npm-scope`) or the root runway's
  `product.key` (`@figentra/<product>-service-<name>`, ADR 0349 decision 2), writes the stackra/template shape (`#src`
  and `#assets` imports, the `./assets/*` export, `catalog:stackra` versions in a product repository), and gains
  `--over`, which regenerates over an existing member: only missing files are written and authored files get a printed
  diff; `CHANGELOG.md`, `runway.yaml` and `src/` are never touched (STA-1210).
- 2787c1e: Add `@stackra/cli`, the `stackra` binary, thin first. `stackra gen [--check]` runs gen-core on a member or on every
  `stackra.config.ts` member at the workspace root and prints each refusal with its fix. `stackra dev|build|start|
  typecheck|test|lint` run gen, then the member's tool with the config gen wrote into `.stackra/`: Vite, Expo, tsdown,
  Wrangler, the generated Encore app, Mintlify, vitest, Playwright, Maestro, tsc and oxlint, chosen by layout and target;
  at the workspace root they run `turbo run <task>`. `stackra ls [section]` lists the identities a committed manifest
  locks. `stackra mcp`, `stackra mcp sync`, `stackra mcp exec --`, `stackra agents sync` and `stackra agents check`
  wire `@stackra/mcp`. The old `console` command framework is folded in as a small `node:util` `parseArgs` core.
- 145435d: `stackra dev` runs a product with no app members locally. `--surface <s> --os <checkout>` starts the local shell's own
  Vite, which serves the product packages' `./<surface>` entries from source with hot reload (and a landing site's seed
  document from `content`), so gen's bundle mode is no longer needed for a local shell. `--mobile <app> --os <checkout>
  --device <udid>` prepares the app from its template line with Runway's `prepareMobileDev`, prebuilds it and runs a
  Release build on the iOS simulator. `--product --os <checkout>` runs every surface and mobile app of the root runway.
- 6ad4813: Add `stackra settings:diff` and `stackra settings:apply`, which run a settings pack against a scope node through the
  member's `@stackra/settings/node`; `stackra seed-pack` now runs without `--check` against `@stackra/database/node`'s
  seed runner.
- 37e1aa8: Docs site target (stackra-176): gen assembles a docs app's Mintlify root into `.stackra/site` from a typed `DocsConfig`
  (pages in `src/docs`, assets in `src/assets`, snippets in `src/snippets`) with the `docs_*` refusals; `stackra
  dev|build|lint` run Mintlify in the generated site; runway's `MintlifyProviderDriver` (now a `Driver(RunwayProvider)`,
  so runway depends on `@stackra/container`) publishes it as an orphan commit to `targets.mintlify.branch`.
- 2c05f14: Gen runs in two passes so services that consume each other's clients in a cycle can bootstrap (STA-1232). Pass 1
  writes every member's `stackra.manifest.json` without its clients (a consumed service in the same workspace is no
  longer a refusal there); pass 2 writes the clients and the rest against those manifests, in rounds until one writes
  nothing. A refused run still writes its clients and, when only workspace services stand in the way, its manifest.
  New: `stackra gen --manifests` (pass 1 alone), `generate(root, { pass: "manifests" })`, `generateMember(..., { pass })`,
  `emitClients(ir, { pending })` and `MemberIR.workspaceServices`.
- 6a03936: Member metadata for people and agents (ADR 0453 decision 11, amendment of 2026-10-27, STA-1072). `@stackra/skills`
  adds the `package` kind's `tier`, `category`, `runtimes` and `summary` to `StackraManifest` and
  `STACKRA_MANIFEST_SCHEMA`, with the vocabularies `StackraTier`, `StackraCategory` and `StackraRuntime`.
  `@stackra/repo-checks` adds `checkMemberMetadata` (keywords, repository, homepage, bugs, author, engines, the `stackra`
  field against the folder and its turbo tags), `npmMetadataFor`, `turboTagsFor` and `MEMBER_METADATA`, run by the
  `structure` phase in the Stackra repository. `stackra new` writes the field, the tags and `--summary`.
- a1eb70f: A product with no app members builds and deploys from its CI: `stackra build --product [--dry-run]` builds every
  surface's extension bundle against its shell line's import map and every mobile app's EAS build, and writes
  `dist/product/build.json`; `stackra deploy --product --env <environment>` publishes the bundles and host rows, lists
  the landing seeds, submits the mobile builds, and waits on the environment's approval (`--approved`). Runway adds
  `buildProduct`, `deployProduct`, `workspacePackages` and `exportSourceOf`; the mobile job takes `buildOnly` and `packages`.
- 68ae29e: Search index registry and reindex jobs (ADR 0404 d3, ADR 0221 d7): `search.indexes` with `SearchIndexState`,
  `SearchIndexRegistry` (`list`, `invalidateChanged`, `begin`/`progress`/`finish`), `searchFacetHashOf`, resumable
  `SearchIndex.reindex({ after, since, onBatch })`, the `reindexSearch` and `reindexSemantic` work that the reindex jobs
  of `@stackra/data-maintenance` run, and the `stackra search:reindex [Model] [--scope-id --scope-path] [--since]
  [--semantic]` and `stackra search:status` commands through the member's `searchReindex` (of
  `@stackra/data-maintenance/node`) and `searchStatus` runners.
- 659b103: Add `stackra new <package|service|seed-pack> <name>`, which writes members in the programming model v3 shape and
  product seed pack skeletons, and `stackra seed-pack <product>`, which checks a `seed-pack:<product>` (`--check`) or
  seeds its `minimal`, `demo` or `test` profile through the member's seed runner, writing only new and changed
  seed-owned records and never a record a tenant changed.

### Patch Changes

- 6f757ed: `stackra new service` declares `@stackra/app` and `@stackra/container`, which the server entry and the Encore app gen
  writes import, so a fresh service passes
  `stackra gen`'s generated-dependency check. `stackra build` in a package gen wrote no entry for, with no tsdown config of
  its own, says there is nothing to build and exits 0 instead of failing in tsdown.
- c2da3a7: `stackra search:reindex` loads `searchReindex` from the member's `@stackra/data-maintenance/node`, where the reindex
  jobs now live; `stackra search:status` still loads `searchStatus` from `@stackra/search/node` and needs no add-on.
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
- 49c7944: Breaking rename for unique public names (STA-1383): the `stackra` field type of a registry item's `package.json` in
  `@stackra/skills/contracts` is `StackraPackageField`, so `StackraManifest` is only `@stackra/contracts`' type of a
  member's committed `stackra.manifest.json`. `STACKRA_MANIFEST_SCHEMA` keeps its name.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [854d7a9]
- Updated dependencies [0abe92d]
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [94ae85f]
- Updated dependencies [62c7ae1]
- Updated dependencies [37e1aa8]
- Updated dependencies [cc8db5e]
- Updated dependencies [bbec10c]
- Updated dependencies [c857043]
- Updated dependencies [0a38324]
- Updated dependencies [9fa326c]
- Updated dependencies [3840889]
- Updated dependencies [3730669]
- Updated dependencies [fb11778]
- Updated dependencies [f55eced]
- Updated dependencies [9c799c4]
- Updated dependencies [165fae0]
- Updated dependencies [957fe36]
- Updated dependencies [cda22dd]
- Updated dependencies [a45aec8]
- Updated dependencies [727e5f7]
- Updated dependencies [783fb5b]
- Updated dependencies [401d703]
- Updated dependencies [a3611b4]
- Updated dependencies [2562581]
- Updated dependencies [cac7c42]
- Updated dependencies [d5b457f]
- Updated dependencies [2c78113]
- Updated dependencies [2787c1e]
- Updated dependencies [ca33793]
- Updated dependencies [c868bad]
- Updated dependencies [640ae17]
- Updated dependencies [7cbd46d]
- Updated dependencies [0f3325f]
- Updated dependencies [d7c5bf2]
- Updated dependencies [8c52f12]
- Updated dependencies [4f92d09]
- Updated dependencies [1ab0f73]
- Updated dependencies [2c05f14]
- Updated dependencies [780b049]
- Updated dependencies [a78c614]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [2787c1e]
- Updated dependencies [835e1d2]
- Updated dependencies [1c6c2e2]
- Updated dependencies [6a03936]
- Updated dependencies [830ea4a]
- Updated dependencies [914465a]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [954bf08]
- Updated dependencies [0a20a9f]
- Updated dependencies [8b38906]
- Updated dependencies [1b4effa]
- Updated dependencies [a1eb70f]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3b19f6d]
- Updated dependencies [de58cb5]
- Updated dependencies [3047b44]
- Updated dependencies [512884e]
- Updated dependencies [a32b62d]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
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
- Updated dependencies [3649655]
- Updated dependencies [c526bed]
- Updated dependencies [fd13f0e]
- Updated dependencies [2787c1e]
- Updated dependencies [55e2558]
- Updated dependencies [49c7944]
- Updated dependencies [fa41d2d]
- Updated dependencies [088998e]
- Updated dependencies [e756399]
- Updated dependencies [a55aa40]
- Updated dependencies [cbc545c]
- Updated dependencies [2787c1e]
- Updated dependencies [dacb5c2]
- Updated dependencies [fd13f0e]
- Updated dependencies [349db18]
- Updated dependencies [5e8114b]
- Updated dependencies [8a1be69]
- Updated dependencies [d19a3d5]
- Updated dependencies [d19a3d5]
- Updated dependencies [d19a3d5]
  - @stackra/gen@0.1.0
  - @stackra/config@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/runway@0.1.0
  - @stackra/mcp@0.1.0
  - @stackra/repo-checks@0.1.0
  - @stackra/skills@0.1.0
  - @stackra/support@0.1.0

Written by Changesets on release; never edited by hand.
