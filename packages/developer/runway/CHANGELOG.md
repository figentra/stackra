# @stackra/runway

## 0.33.0

### Minor Changes

- 0f7448f: A root runway can declare one `gotenberg` resource, the PDF engine `@stackra/documents` renders through. Runway runs it
  as an internal Fargate workload:
  
  - the Chromium image pinned by digest and pulled through the ECR pull-through registry named in
    `shared.network.registry`;
  - basic auth on, no URL fetching;
  - its own 443-only egress group;
  - FARGATE_SPOT outside production.
  
  `ensureGotenbergCredentials` writes the password once and hands every consumer `DOCUMENTS_GOTENBERG_URL` and
  `DOCUMENTS_GOTENBERG_AUTHORIZATION`.
- c7144a0: The white-label job starter (ADR 0439 decision 8, STA-2074). `startWhiteLabelJob(request)` turns the OS event
  `white_label.build.requested.v1` into the mobile job's variant and runs `runMobileJob` for the event's app.
  `whiteLabelVariantOf(event)` carries the scope, the entitlement keys and the identity parts the scope sets; a null,
  empty or blank part is dropped, so the runway entry's stays. An event with no scope or app is refused before the job
  runs. `WhiteLabelBuildRequested` and `WhiteLabelJobRequest` are exported.

### Patch Changes

- Updated dependencies [54aa1e7]
- Updated dependencies [82c2718]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
  - @stackra/app@0.33.0
  - @stackra/config@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/console@0.33.0
  - @stackra/container@0.33.0
  - @stackra/validation@0.33.0

## 0.32.0

### Patch Changes

- Updated dependencies [33f61e5]
- Updated dependencies [9ddce28]
  - @stackra/app@0.32.0
  - @stackra/config@0.32.0
  - @stackra/console@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Minor Changes

- 5585893: `providers.github` takes the repository metadata: `description` (one sentence, at most 350 characters), `topics`
  (lower-case GitHub topics, each once, at most 20) and `homepage` (an absolute URL). `githubPlan` carries them and
  `githubStack` sets them on the repository (`description`, `topics`, `homepageUrl`), so a `preview` of the github
  stack shows a repository whose metadata drifted from its runway. `@stackra/runway`'s closed `providers.github`
  schema takes the same three keys, so `parseRunway` accepts them.
- ebfd942: `runMobileJob` reads mobile `whiteLabel.entitlement`: a scope-started white-label build is refused unless the
  variant's new `entitlements` list holds it. The field leaves `RUNWAY_UNREAD_FIELDS` and its schema description no longer
  says "Not read yet".
- 670f75c: A workload can name `migrate: { command, timeoutMinutes? }`: a one-off task with the workload's image, env, secrets
  and resources that runs once per new revision before the service rolls, and stops the apply when it fails or times
  out (15 minutes by default). On AWS it is a second Fargate task definition run by a Pulumi dynamic resource through
  `@aws-sdk/client-ecs`, which the stacks repository must list beside `@pulumi/aws`.

### Patch Changes

- @stackra/app@0.31.0
  - @stackra/console@0.31.0
  - @stackra/config@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/validation@0.31.0

## 0.30.0

### Minor Changes

- a3a3190: A service runway's `environments.<env>.database.extensions` now takes only the Postgres extensions ADR 0160 approves:
  vector, pg_trgm, ltree, citext, pgcrypto, postgis, pg_stat_statements and btree_gist. `@stackra/runway` exports them
  as the `PostgresExtension` enum and the frozen `APPROVED_POSTGRES_EXTENSIONS` list, and the shipped
  `schema/service.json` carries them as an `enum` on `extensions.items`. Any other name is refused with its path.
  
  The AWS runtime plan carries each Postgres server's extensions (`DatabasePlan.extensions`, the names its member
  consumers list, once and sorted) and those it preloads (`preloadLibraries`). A server that preloads one gets its own
  parameter group (a cluster parameter group on Aurora) setting `shared_preload_libraries`, applied at the next reboot.
  
  `@stackra/database`'s `Extension` adds `BtreeGist`, so a migration may run `schema.createExtension(Extension.BtreeGist)`.
- 0765ecc: Runway publishes a pull request's preview (STA-1907, ADR 0289 decision 7).
  
  - `publishProduct({ environment: "preview", pullRequest: n })` uploads the console bundle and writes
    `host:<product>-pr-<n>.figentra.cloud` and `release:<product>:console:pr-<n>`, both expiring after 7 days, with no canary; the
    answer carries `host`. A host row another product holds is refused before any upload. `pullRequestPreviewHost(product, n)` and `PULL_REQUEST_PREVIEW_SETTINGS` are exported.
  - `EdgeKvWriter.put(key, value, ttlSeconds?)` takes an optional expiry; `WranglerEdgeKvDriver` passes it as `--ttl`.
  - `EdgeKvWriter.read(key)` answers the row or `null`; every driver implements it (wrangler's `kv key get --text`,
    where the API's 404 is `null`).
  - The product command takes `--pr <n>` (or `STACKRA_PULL_REQUEST`) with `--env preview` (digits only), and prints the host.
- f4df473: A worker workload needs no port: `port` and `health` are optional unless the workload is `public`, and an internal
  worker may name `healthCommand`, which becomes its Fargate container's health check (no port mapping is declared).

### Patch Changes

- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [04d04e4]
- Updated dependencies [0394e56]
- Updated dependencies [7d60f82]
- Updated dependencies [8c17109]
- Updated dependencies [f6a087c]
- Updated dependencies [ef49e63]
- Updated dependencies [0765ecc]
- Updated dependencies [cd2496b]
  - @stackra/contracts@0.30.0
  - @stackra/app@0.30.0
  - @stackra/container@0.30.0
  - @stackra/console@0.30.0
  - @stackra/config@0.30.0
  - @stackra/validation@0.30.0

## 0.29.0

### Patch Changes

- Updated dependencies [3361957]
- Updated dependencies [b4b6422]
  - @stackra/app@0.29.0
  - @stackra/container@0.29.0
  - @stackra/console@0.29.0
  - @stackra/config@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- @stackra/app@0.28.0
  - @stackra/console@0.28.0
  - @stackra/config@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Patch Changes

- @stackra/app@0.27.0
  - @stackra/console@0.27.0
  - @stackra/config@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Patch Changes

- @stackra/app@0.26.0
  - @stackra/console@0.26.0
  - @stackra/config@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/validation@0.26.0

## 0.25.0

### Patch Changes

- @stackra/app@0.25.0
  - @stackra/console@0.25.0
  - @stackra/config@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/validation@0.25.0

## 0.24.0

### Patch Changes

- @stackra/app@0.24.0
  - @stackra/console@0.24.0
  - @stackra/config@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [c26fb86]
- Updated dependencies [6edeee4]
- Updated dependencies [a42a80c]
  - @stackra/app@0.23.0
  - @stackra/console@0.23.0
  - @stackra/config@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/validation@0.23.0

## 0.22.0

### Patch Changes

- Updated dependencies [940e198]
  - @stackra/app@0.22.0
  - @stackra/console@0.22.0
  - @stackra/config@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/validation@0.22.0

## 0.21.0

### Minor Changes

- 2974e54: Subresource Integrity for extension bundles. The bundle build records a sha384 for every emitted file in
  `bundle.manifest.json` (`integrity`). Runway refuses to publish a bundle whose file is missing or changed since the
  build, carries each value by URL on the edge release, and the shell page pins every bundle URL with it: an
  `integrity` attribute on each modulepreload and stylesheet link, and the import map's `integrity` block for the
  chunks no link names. A bundle built before this has no `integrity` and renders as before.

### Patch Changes

- Updated dependencies [ae9cb23]
- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/app@0.21.0
  - @stackra/contracts@0.21.0
  - @stackra/validation@0.21.0
  - @stackra/console@0.21.0
  - @stackra/config@0.21.0
  - @stackra/container@0.21.0

## 0.20.0

### Minor Changes

- 3b48b0f: `runway evidence` judges `rollout` per target. A production Workers member with more than one traffic step and no
  Durable Object migration is `true`; a migrating or single-step member, and every other declared target, is `false`; an
  unknown is `null`. `rolloutDetail` adds `steps` and `floorReason`; `release.strategy` is no longer read.
  
  Every Worker now moves production traffic in `[10, 50, 100]` steps by default. The `public-site`, `internal-tool` and
  `cache` presets stay at one step, and a member can name its own. A Worker that was never deployed moves at once, since
  there is no version to split with.

### Patch Changes

- 671c9fd: The `encore-cloud` driver's verify polls `<origin>/readyz` with backoff (5 s, doubling to 60 s) while Encore Cloud
  builds the pushed commit, instead of reading it once right after the push. A 404 ("application not found"), a 5xx or
  no answer counts as still building until `encore.readyTimeoutMinutes` (15 by default) passes; then verify reports down
  with the last answer. A first deploy no longer fails verify before Encore has built it.
- Updated dependencies [a7b7e58]
- Updated dependencies [667a3b5]
  - @stackra/container@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/app@0.20.0
  - @stackra/console@0.20.0
  - @stackra/config@0.20.0
  - @stackra/contracts@0.20.0

## 0.19.0

### Minor Changes

- bac874e: The last Infisical uses in the developer packages move to sops and figentra/secrets (ADR 0525).
  
  - `stackra mcp exec -- <argv>` decrypts each `$NAME` the command names with `sops exec-env` from the `agents` scope of
    the local figentra/secrets clone (`$STACKRA_SECRETS_DIR`, default `~/.stackra/secrets`), one nested call per secret,
    instead of `infisical run`. Its `--env` and `--path` flags are gone; `McpExecOptions` is now `{ secretsDir? }`.
  - Mobile onboarding no longer writes the FCM key to a vault: it goes only to EAS, its one reader, and running the
    `push` step again replaces a lost key. `InfisicalVaultWriterDriver` is removed, and `MobileOnboardRequest` has no
    `vault` port. A missing root-kit name prints `pnpm secrets:put <NAME> --scope ci/production/store` as its owner step.
  - gen's `env` manifest rows no longer carry `home` (the Infisical folder `/runtime/<member>`), and the field is gone
    from the `StackraManifest` type; runway already ignored it. Products regenerate their manifests after the release.
  - `stackra dev --tunnel` names the sops way to start with `CLOUDFLARE_TUNNEL_TOKEN`, and the service template's
    `runway.yaml` header names figentra/secrets.
- 414586e: `runway evidence <environment> --target <t> --sha <sha> [--member <m>]` writes the approvals bot's evidence for
  one deploy job (ADR 0533): `runway-evidence-<environment>[-<member>].json` with the repo, commit, target and member,
  `rollout` (true only for a gradual `release.strategy.kind` with `autoRollback`) and `destructive` (null, the owner's,
  until gen classifies migrations). The contract `runway.evidence/v1` is agreed with figentra/infra's classifier.
- 7a83de3: `runway validate` warns on every Mintlify field a root runway still sets (ADR 0514): `providers.mintlify`,
  `targets.mintlify` and a `mintlify` destination. The docs app is a Fumadocs site on a Worker, deployed by
  `cloudflare-workers`. The fields stay accepted for one release; the `mintlify` driver goes with them.
- 1f33c82: Runway no longer reads Infisical (ADR 0525). The secret sync (`runway secrets sync`, and `stackra deploy` with
  `secrets.sync: on-deploy`) and the Workers provider read every declared secret from the job's environment, where
  `.github/actions/secrets-decrypt` put the product's sops scope. `--from-env` is still accepted on both commands but does
  nothing and prints a deprecation note; it goes in the next minor release.
  
  - A product's runtime secrets live in the scope `products/<project>/<dev|staging|production>`; a preview reads dev's.
    `deployPlan` gives `secretScope` in place of `infisicalEnvironment`, and a `SecretSyncEntry` gives `scope` in place
    of `path`. The secret entries of `deployPlan(...).sync` no longer carry a `path`.
  - `providers.infisical` is no longer typed in the root schema, and `secrets.defaultPath` is ignored. A runway.yaml that
    still has either passes validation, and `runway validate` warns on each for one release: remove them.
  - `runway env check` checks each name against the sops scope of its environment, and counts the `names:` of a
    `secrets-decrypt` step as declared, in place of Infisical `secret-name:` steps. Names only, no login.
  - `runway env check --values --env <env>` reads the values from the job's environment and checks only that
    environment; `--project-id` is gone.
  - `runway env orphans <env> [--dir <d>]` lists the scope's names from its ciphertext file names, decrypting nothing;
    `--project-id` is gone.
  - `readMemberSecrets` takes `env` and no longer takes `source` or `run`. `syncSecrets` no longer takes `fromEnv`.
  - infra-github still sets the `INFISICAL_DOMAIN` and `INFISICAL_PROJECT_ID` variables from an untyped
    `providers.infisical` block while CI logins need them.

### Patch Changes

- 2933e48: `publishProduct` requires canary scopes only in production. D6 stages a release for real tenants first, so a dev or
  staging publish without `canaryScopes` now writes the `release:` pointer directly instead of refusing. Production
  still refuses without them unless the release is marked first.
- e105174: The infrastructure and developer packages describe sops and figentra/secrets instead of Infisical (ADR 0525).
  
  - `@stackra/infra-aws-runtime`: the RDS Proxy login secret's description names the vault, not Infisical, so the next
    apply updates that description in place. The docs name the vault and runway's secrets sync.
  - `@stackra/infra-tools`: the tools-stack secrets sync is the vault's (`secretsSync` keeps its shape: `source`,
    `principal`, `externalId`); the missing external id error names the secrets sync.
  - `@stackra/infra-github`, `@stackra/infra-cloudflare`, `@stackra/infra-identity`, `@stackra/infra-observability`,
    `@stackra/runway`, `@stackra/mcp`, `@stackra/cli`, `@stackra/fiscal`, `@stackra/licensing`: docs and comments only.
    `githubPlan` still turns `providers.infisical` into the `INFISICAL_*` CI variables until plan phase P6.
- c239773: `DeployRunways` types the root runway's `providers.encore.app`, the Encore app the secrets sync writes into, so the
  sync and its callers typecheck again.
- Updated dependencies [58e3066]
- Updated dependencies [cb26737]
- Updated dependencies [bac874e]
  - @stackra/contracts@0.19.0
  - @stackra/config@0.19.0
  - @stackra/app@0.19.0
  - @stackra/console@0.19.0
  - @stackra/container@0.19.0
  - @stackra/validation@0.19.0

## 0.18.1

### Patch Changes

- baee3a3: The Cloudflare Workers provider hands secrets to `wrangler versions upload` in a 0600 file in a fresh temporary
  folder, removed right after the upload, instead of `--secrets-file /dev/stdin`, which wrangler can't open when stdin
  is a socket (Linux CI runners, ENXIO).
- @stackra/app@0.18.1
  - @stackra/console@0.18.1
  - @stackra/config@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/validation@0.18.1

## 0.18.0

### Patch Changes

- 15cd10c: The Encore deploy commit holds every service member as one Encore app at the repository root (STA-2194): it rewrites
  each member's `#` imports to relative paths through the member's own package.json map (Encore resolves neither
  `imports` nor a per-member tsconfig), drops the members' `__tests__` folders and writes `encore.app` at the root. A
  product with several services (billing, pay, commerce, os) now deploys as one app, and the members' apps must name one
  Encore app id.
  Each service declares `encore.dev`, which Encore Cloud installs from the service's package.json.
- dbf1c33: The secret sync writes Encore secrets from a temporary folder holding only `encore.app` with the root runway's
  `providers.encore.app`, instead of `<repo>/.stackra/encore`, which gen never writes (the generated app sits under each
  service member, and the deploy commit roots it at the repository). tamo's staging sync failed with ".stackra/encore
  does not exist". A runway without an Encore app id is refused before anything is written (STA-2193).
- @stackra/app@0.18.0
  - @stackra/console@0.18.0
  - @stackra/config@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/validation@0.18.0

## 0.17.2

### Patch Changes

- 2da4d9d: Fixes from typechecking os on 0.17.1. Runway's eleven commands and `stackra runway` are `bin` commands, so no member
  hosts them (their classes are not exported from `@stackra/runway/node`), and gen hosts console commands only from a
  member's runtime `dependencies`, never its devDependencies. A hosted package's entities carry no `~defaults` marker its
  published types lack, and a package-base override no longer imports a field hatch it does not use.
- @stackra/app@0.17.2
  - @stackra/console@0.17.2
  - @stackra/config@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/validation@0.17.2

## 0.17.1

### Patch Changes

- @stackra/app@0.17.1
  - @stackra/console@0.17.1
  - @stackra/config@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/validation@0.17.1

## 0.17.0

### Minor Changes

- 4c6bf13: `stackra runway <command>` runs every Runway command (ADR 0529 decision 4): the same options, exit codes and `--json`
  output as the `runway` binary, which now prints a deprecation notice and stays only as an alias for one minor release.
  `@stackra/runway/node` exports `RUNWAY_COMMANDS`.

### Patch Changes

- @stackra/console@0.17.0
  - @stackra/config@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/validation@0.17.0
  - @stackra/app@0.17.0

## 0.16.0

### Patch Changes

- 89d4633: The Encore deploy commit has no parent: it holds the source tree with the generated app, and its message names the
  source commit. Encore's remote refused the earlier deploy commit ("shallow update not allowed") because a CI checkout
  at depth 1 ends on a shallow boundary, and the product's history is not Encore's to hold.
- 08be546: `runway secrets sync` now carries the root runway's `secrets.gateway` names, the generated API gateway's
  secrets (ADR 0237), into Encore as one more entry, `gateway`, whenever a service member makes an Encore app.
  Before, only each member's own `secrets:` reached Encore, so a product whose only runtime secret is
  GATEWAY_VISITOR_SIGNING_KEY synced nothing.
- Updated dependencies [64cfc1d]
- Updated dependencies [5bf8ad3]
  - @stackra/app@0.16.0
  - @stackra/validation@0.16.0
  - @stackra/console@0.16.0
  - @stackra/config@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- @stackra/app@0.15.0
  - @stackra/console@0.15.0
  - @stackra/config@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/validation@0.15.0

## 0.14.4

### Patch Changes

- fda1d53: The `encore-cloud` provider pushes a deploy commit Encore can build. The generated app is gitignored, so apply now
  commits, on top of the source commit and in a temporary checkout, the service member's generated outputs, the
  workspace packages' build outputs, the member's `encore.app` (the member folder becomes the Encore app root) and a
  `tsconfig.json` whose `paths` mirror the member's `imports`, then force-pushes that commit to the environment's
  branch. Verify and rollback follow the pushed commit. A repository with no generated app pushes the source commit as
  before; one with two service apps is refused until they share one app root.
- @stackra/app@0.14.4
  - @stackra/console@0.14.4
  - @stackra/config@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/validation@0.14.4

## 0.14.3

### Patch Changes

- 3ccf74a: A dry-run product build records the mobile checkout's `pnpm install` instead of running it, as it records the EAS
  builds: `stackra build --product --dry-run` stays a plan.
- 64e4840: The mobile job builds on the environment's EAS channel: `environments.<env>.mobile.channel` from the root runway
  picks the build profile and channel, and the app's `mobile.<app>.eas.channel` is the fallback. A staging deploy built
  on the app's production channel before.
  
  `mobile.<app>.eas.slug` names the EAS project's slug when it is not `<project>-<app>`, so an app built under a
  project created as `pay` (not `figentra-pay-pay`) passes EAS's slug check.
- @stackra/console@0.14.3
  - @stackra/config@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/validation@0.14.3
  - @stackra/app@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/console@0.14.2
  - @stackra/config@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/app@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- 857a7fb: The mobile job installs the template checkout before the EAS build: with no `node_modules`, it copies the product's
  `.npmrc` in and runs `pnpm install --ignore-workspace --no-frozen-lockfile --ignore-scripts` there, so EAS can load the
  config plugins `app.json` names (Pay staging failed on `react-native-bottom-tabs`).
- @stackra/console@0.14.1
  - @stackra/config@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/validation@0.14.1
  - @stackra/app@0.14.1

## 0.14.0

### Minor Changes

- 54e05c6: `runway secrets sync <env> --from-env` reads each member's declared values from the job's environment, where `.github/actions/secrets-decrypt` put the product's sops scope (ADR 0525), instead of Infisical. A missing name fails before anything is written, and the error names the scope to decrypt. Everything else stays as it was: it writes only in a proved CI job, prints names only and writes each name to Encore once.

### Patch Changes

- @stackra/console@0.14.0
  - @stackra/config@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/validation@0.14.0
  - @stackra/app@0.14.0

## 0.13.0

### Minor Changes

- dc4b3f0: Each product declares its operations in its root runway (the design of 2026-11-06).
  
  - **Tier.** `environments.<env>.tier` names one of `staging`, `launch` or `growth`, from the finance tiers. Production defaults to `launch` and every other environment to `staging`.
  - **Sizes.** The typed keys `shared.database` (`class`, `multiAz`, `storageGb`), `shared.cache` (`mode`, `class`, `nodes`) and `shared.network.natGateways` override the tier. `environmentSizesOf` resolves what an environment runs at, and `runway validate` refuses a t4g or m6g cache class in `me`.
  - **Alerts and routes.** `observability.alerts` covers error rate, p95 latency, budget, database CPU, connections and free storage, and cache memory and evictions. `observability.notify` sets the routes per severity: `oncall`, `email:`, `slack:<channel id>` or `linear:<team key>`. infra-observability applies the defaults (staging and production alarmed, critical to on-call) and returns both in its plan.
- 5d10209: `runway secrets decrypt --scope <scope> [--dir <dir>] [--names A,B]` (ADR 0525) runs inside a GitHub Actions job. It decrypts one figentra/secrets scope with the job's own Cloud KMS identity, reading the per-secret `<scope>/<NAME>.enc.yaml` ciphertext that `.github/actions/secrets-decrypt` downloaded. It masks every value and exports it into `GITHUB_ENV` for the steps after it. It prints names only, and refuses to run without `GITHUB_ENV`. Together with the shared action (Workload Identity login, a `gcloud storage cp` of the scope, then this command), it replaces every Infisical login step.
- 6e61084: A Worker's Custom Domains are runway settings (ADR 0519): `customDomains: [host]` on a `targets.cloudflare-workers` member, its defaults or an environment override. The renderer writes each host as a wrangler `routes` entry with `custom_domain: true`, and refuses a member whose `wrangler.jsonc` still holds `routes`.

### Patch Changes

- @stackra/console@0.13.0
  - @stackra/config@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/validation@0.13.0
  - @stackra/app@0.13.0

## 0.12.0

### Minor Changes

- e36505c: A product's root runway opts in to the cloud estate figentra/infra vends (ADR 0524): `providers.aws.account: true` for its one AWS account and `providers.gcp.project: true` for its one GCP project, both false by default, with `providers.gcp.apis` naming the `*.googleapis.com` services infra enables. An environment's `region` fixes its cloud (me and eu run in AWS, ksa in Google Cloud), so `runway validate` refuses a ksa environment without `providers.gcp.project: true` and warns on an AWS account no me or eu environment uses. An environment's `cloud` is deprecated and warns. Runway exports `unusedCloudOptIns`.

### Patch Changes

- @stackra/console@0.12.0
  - @stackra/config@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/validation@0.12.0
  - @stackra/app@0.12.0

## 0.11.1

### Patch Changes

- @stackra/console@0.11.1
  - @stackra/config@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/validation@0.11.1
  - @stackra/app@0.11.1

## 0.11.0

### Minor Changes

- 46951df: The root runway carries the estate figentra/infra derives from (ADR 0524): `environments.<env>.region` (`me`, `eu` or
  `ksa`), which `runway validate` and `stackra validate --repository` require on a product's staging and production;
  `providers.aws.budgets.monthlyUsd` (default 300) beside the open thresholds; and `providers.cloudflare.records`, the
  non-Worker DNS records (verification TXT, MX, CAA) under a declared zone, an MX with its priority and only A, AAAA and
  CNAME proxied. `providers.aws.region` and `providers.aws.accounts` are deprecated: `runway validate` warns, and they go
  in the next release. Runway exports `checkEnvironmentRegion`, `deprecatedFields` and `RegionKey`.

### Patch Changes

- @stackra/console@0.11.0
  - @stackra/config@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/validation@0.11.0
  - @stackra/app@0.11.0

## 0.10.0

### Minor Changes

- 4c0eead: `runway env check` (ADR 0173 amendment 2026-11-04, STA-2104): the names-only environment check. Every declared name
  (a member manifest's `env` rows, a member runway's `secrets:`, a workflow Infisical step's `secret-name:`) must have an
  Infisical home; a raw read of an undeclared name, an export-all step and a deploy secret no code declares are
  warnings. No login, never a value. The Quality Gate runs it on every pull request.
- 4749967: `runway env sync` is `runway secrets sync` under the ADR 0173 amendment of 2026-11-04 (STA-2104): an alias, not a
  second tool. The sync, the deploy plan and the Workers provider's secret read now take each member's
  manifest-declared names (gen's `env` rows, filtered by their environments) beside its runway `secrets:`, so a name
  declared in code reaches its runtime without a runway line. `readRunways` reads the names from each member's
  committed `stackra.manifest.json`.
- f511762: `runway env check --values --env <env>` and `runway env orphans <env>` (ADR 0173 amendment 2026-11-04, STA-2104).
  In a CI job its GitHub OIDC token proves, the value check reads each declared name from its Infisical home and checks
  it against its rules (missing, type, bounds, refused prefixes): an error in the deployed environment, a warning in its
  sibling non-production environments. It prints names, pass or the broken rule and at most a SHA-256 prefix, never a
  value. `env orphans` warns on Infisical names no code declares. `--project-id` takes the job's runtime project.
- ea40871: The `runway` binary runs on `@stackra/console` (ADR 0506 decision 8): `plan`, `deploy`, `promote`, `drift` and
  `secrets sync` keep their words, and ADR 0352's `rollback <sha>` (refuses the head of origin/main), `status [env]`
  (each GitHub environment's latest deployment record) and `validate` (schemas, placement, drivers and service
  requirements; exit 1 with each finding) are new. `--json` gives each command's data in the envelope, `runway help
  <command>` its help, and a usage error exits 2. `repositoryRoot` takes the folder to start from. The README lists
  every command.
- 0d65e3f: `runway drift [env]` compares what the `cloudflare-workers` provider renders from `runway.yaml` with what Cloudflare
  reports for each Worker (ADR 0519 decision 7, STA-1992), prints the settings that differ and exits 1 on any. It only
  reads, with `CLOUDFLARE_API_TOKEN_READ`. `CloudflareWorkersProviderDriver.drift` and `diffWorkerSettings` are the same
  check as code.
- 242ebe4: `checkDestinations(root)` refuses a destination or target block no driver serves (owner decision O8):
  destinations must be `encore-cloud`, `cloudflare-workers`, `eas` or `mintlify`, and target blocks one of
  those, `npm` or `electron-release` (the desktop feed origin builds read). `stackra validate` runs it on the
  root runway. Core's dev environment drops its `compose`, `vite-dev`, `expo-dev` and `mint-dev` lines.
- 242ebe4: Approvals and "CI only" are proved, never asserted (STA-2099 item 4). `proveGithubJob` asks the GitHub
  Actions runner for an OIDC token (audience `stackra-runway`), checks GitHub's RS256 signature, the issuer,
  the expiry and the repository, and, for an approval, that the job runs in that runway environment or in a
  GitHub environment `providers.github.environments` declares with reviewers. The deploy, promote and
  product deploy commands prove an environment's `deploy.approval` with it; `--approved` is still parsed
  and proves nothing. Reading runtime secrets from Infisical and `stackra mobile onboard --check|--live`
  need the proof instead of `GITHUB_ACTIONS=true`. A job needs `permissions: id-token: write`.
- 0d65e3f: The `cloudflare-workers` provider now renders each Worker's wrangler config from `runway.yaml` before it deploys
  (ADR 0519, STA-1989): the member's `wrangler.jsonc` stays the code facts, and the merged operational settings (the
  base, the preset, `defaults`, the member and its `environments.<environment>` entry) are added in wrangler's keys.
  `renderWranglerConfig` is exported from `@stackra/runway`, and a member may now set `environments`. `stackra
  validate` refuses an operational key (`compatibility_date`, `workers_dev`, `observability`, `routes` and the rest) in
  a new member's `wrangler.jsonc`; the four existing Workers are listed until they deploy through the provider.
- c4348cd: Runway's child-process helper is `runProgram` (was `runCommand`, file `run-program.function.ts`): a Command is a
  CLI command only (ADR 0294 d23), and `@stackra/console` exports `runCommand` (one symbol, one owner, d15). Behaviour
  unchanged. The duplicate-exports allowance for `runCommand` is gone.
- 0d65e3f: The `cloudflare-workers` provider now ships each Worker as a version (ADR 0519, STA-1990): `wrangler versions upload`
  with the commit as its message and the secrets on stdin, a smoke request routed to the version at 0% traffic by
  `Cloudflare-Workers-Version-Overrides` (a failure moves no traffic), then `wrangler versions deploy`. A member may set
  `rollout` (ascending percentages ending at 100); the `api` and `edge` presets use `[10, 50, 100]`, held five minutes
  per step, in production only. A version with a Durable Object migration goes out at 100%. The first deploy of a new
  Worker still needs one `wrangler deploy` by hand, since a version needs a deployment to split with. Rollback stays
  `wrangler rollback` to the recorded version id.
- 0d65e3f: `targets.cloudflare-workers` members are typed (ADR 0519, STA-1988): a member names a `preset` (`public-site`, `api`,
  `internal-tool`, `cache` or `edge`) and may set `compatibilityDate`, `compatibilityFlags`, `workersDev`, `previewUrls`,
  `observability`, `limits`, `cache`, `uploadSourceMaps` and `keepVars`; the target takes the same keys under `defaults`.
  `workerSettingsOf(target, member)` merges the built-in base, the preset, the defaults and the member, with the target's
  `compatibilityDate` as the fallback, and `WorkerPreset` is exported. An unknown preset or Worker key now fails the
  provider's parse. Nothing deploys differently yet; the renderer reads these in the next change.
- 0d65e3f: A root runway's `providers.cloudflare.zones.<zone>` takes the zone policy (ADR 0519, STA-1993): besides a plain id it
  takes `{ id, owner, plan, policy }`, closed, where `policy` is `baseline` or `strict` (Pro only), only the `owner` sets
  it, and an owner states its `plan`. `checkZoneOwners(runways)` reports a zone two root runways own. `zoneEdge` takes a
  `policy` and adds SSL Full (strict), TLS 1.3, Automatic HTTPS Rewrites, HSTS, DNSSEC and CAA records for Cloudflare's
  CAs; `strict` also turns bot protection on and throws on the Free plan. `cloudflareCoreStack` passes the zone's plan and
  policy through. A zone without a policy keeps today's settings. The DS record at the registrar stays the owner's.

### Patch Changes

- a15cacf: A `ref:` Cloudflare account id in `runway.yaml` (`providers.cloudflare.accountId: ref:cloudflare.accountId`) no longer
  reaches wrangler as the account. The deploy job resolves a `ref:`, so the product publish and the edge KV writer now
  leave the job's `CLOUDFLARE_ACCOUNT_ID` in place, and refuse before any upload or KV write when the job has none
  (`RunwayUnresolvedError` names the variable). A literal id is set as before. Runway exports the decision as
  `cloudflareAccountEnv` (STA-2124).
- 0d65e3f: The `cloudflare-workers` provider retries each smoke check (60 attempts, 10 s apart) while a new version or a new
  domain's certificate comes up, and a check can send `Authorization: Bearer` from a named variable. `smoke` is now a
  list of `{ url, bearer? }`, and `secrets` may be a map that reads a Worker secret from another variable
  (`TURBO_CACHE_TOKEN: TURBO_TOKEN`).
- Updated dependencies [e57b9a1]
  - @stackra/config@0.10.0
  - @stackra/contracts@0.10.0
  - @stackra/app@0.10.0
  - @stackra/console@0.10.0
  - @stackra/container@0.10.0
  - @stackra/validation@0.10.0

## 0.9.0

### Minor Changes

- 2aeaec8: `writeDevFacts(root, lane)` in `@stackra/runway/node` writes `.stackra/dev/ports.json`, the file `readDevFacts` reads: each member runway's dev url, port, host, https, TLS files and Electron dev ports with the lane offset applied. `stackra dev` calls it before the member tool starts (lane from `STACKRA_LANE`, default 0). The app runway's `environments.<env>.desktop.devtools` is now read, so it leaves `RUNWAY_UNREAD_FIELDS` and its "Not read yet" schema note.
- 5030040: The runway host map now generates the edge Worker's routes (`surfaceHosts`, `edgeRoutes`): one `<host>/*` per surface host under a runway zone, beside the stack's own patterns. A bare `*/*` route is refused unless the zone lists `exclusions`, which become script-less routes. The CLI's runway ship probes every host of the map after a product publish and fails when one does not serve TLS.
- 93bb1e7: `buildProduct` writes a product's `surfaces.ops.contributes` as a declarative `ops` bundle (the contributions file and its manifest, targeting `ops@1`), and `publishProduct` uploads it and writes its canary or release row like any surface. The root runway schema no longer marks `surfaces.ops.contributes` and its fields "Not read yet", and the list of runway fields not yet read drops them.
- b0d6fcc: The Cloudflare Workers provider reads each Worker's secrets from Infisical (`readMemberSecrets`) when it is given the
  runways, and sends them to `wrangler secret bulk` on stdin, after every value is read and before anything ships (STA-606).
  `stackra deploy` gives it the runways when the root runway says `secrets.sync: on-deploy`; without them the provider
  still reads the deploy job's environment.
- 2e43c48: A service runway environment takes an `events` block for the cross-app event relay (ADR 0511, amendment of
  2026-11-02, STA-1910): `signingKey`, the secret name of the producer's signing key (default
  `STACKRA_EVENTS_SIGNING_KEY`, never a value); `keys`, its public keys, current first; and `subscribers`, each consumer's
  member key, inbox origin (`https`, or `http` to a loopback host) and the event wire names it takes. `schema/service.json`
  describes it.
- ca1614e: `checkRequires(root, service)` reports each `valkey` entry of a service runway's `requires` that no environment's cache driver serves, at `requires.<name>`; `stackra validate` (`checkRunwayFiles`) now runs it for every service runway against the root (STA-2049).
- bd3f314: A runway workload takes `command`, the container's arguments in place of the image's default, and `aliases`, which
  hand the image a variable of a Postgres resource it uses under the name it reads
  (`ZITADEL_DATABASE_POSTGRES_DSN: MAIN_DB_URL`). `runtimePlan` refuses an alias of a variable no used Postgres resource
  publishes, and `awsWorkloads` puts the arguments and each alias's SSM parameter in the task definition. Self-hosted
  ZITADEL, the first workload user, now plans in dev, staging and production (STA-1649).

### Patch Changes

- Updated dependencies [e80a99b]
- Updated dependencies [2e43c48]
- Updated dependencies [f9c825d]
  - @stackra/validation@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/container@0.9.0
  - @stackra/app@0.9.0
  - @stackra/config@0.9.0

## 0.8.0

### Minor Changes

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

### Patch Changes

- 02c47c3: The product publish runs wrangler with `CLOUDFLARE_ACCOUNT_ID` from `providers.cloudflare.accountId` (uploads and KV
  rows), and `stackra deploy --product` passes `appLinks` from `STACKRA_APPLE_TEAMS` (`team=ID,...`) and
  `STACKRA_ANDROID_CERTIFICATES` (`app=AA:BB|CC:DD,...`). `CommandRunner` options take an `env`.
- Updated dependencies [7dd35b3]
  - @stackra/container@0.8.0
  - @stackra/config@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/app@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/app@0.7.1
  - @stackra/config@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/validation@0.7.1

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
