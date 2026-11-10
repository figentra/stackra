# @stackra/cli

## 0.33.0

### Minor Changes

- 41a5ff0: `stackra test --tier e2e` runs in a package too: it uses the `.stackra/playwright.e2e.config.ts` gen writes for a package that has a `.e2e.page.tsx`, and refuses with a hint when there is none. A service or a worker still refuses.

### Patch Changes

- 0ed69c1: The duplicate-export check now exempts five names that two packages each declare for a different concept: `FooterLink`, `RawBody`, `Surface`, `SurfaceKind` and `settingsKeyOf`. Each entry gives its reason. `validate` on main no longer reports them.
- 89253a8: `stackra duplicate-exports` allows five names that today's kit blocks share with older exports, each with its reason:
  
  - `CalendarSystem`: ui derives its picker list from i18n's enum.
  - `LocaleSwitcher` and `LocaleSwitcherProps`: ui's drawn switcher, and i18n's headless kit block that binds it.
  - `PushPermission` and `PushRegistration`: notifications' registration port and its answer, and platform's push address and permission hook.
  
  Main's `validate --repository` reported them.
- 6186329: A service's tsconfig no longer needs `baseUrl` for Encore. TypeScript 7 removed `baseUrl` (TS5102), so the rule from 0.30.0 broke typecheck in a TS 7 repository (INVOICING).
  
  - **The service check:** it now requires only `compilerOptions.paths` equal to package.json `imports`, which resolve from the tsconfig's folder. It refuses a `baseUrl`.
  - **`stackra encore:prepare`:**
    - it removes an existing `baseUrl`;
    - it writes package.json and tsconfig.json with gen's `formatJson`, now exported from `@stackra/gen`, in the repository formatter's layout, so the format check passes after it.
  
  Bump step: run `stackra encore:prepare` in each service, or delete `"baseUrl": "."` from its tsconfig.
  
  `stackra encore:prepare` also keeps a tsconfig's file contract written inside the braces (NOTIFY's services). Before, it kept only the `//` lines above the object, so the contract was dropped and the format check failed. `encore.dev` stays the literal catalog version (ADR 0091 rule 3): Encore rewrites `catalog:` to `^<version>`, which breaks the frozen install.
- 6186329: The `encore.dev` version a service pins can live in the root package.json as `stackra.encore`, so a repository whose
  services pin the literal keeps no unused catalog entry for it. `encoreReferenceVersion` (exported from
  `@stackra/repo-checks/node`) reads `stackra.encore` first and falls back to the default catalog's `encore.dev`; the
  service check and `stackra encore:prepare` use it. A repository that keeps the version in its catalog needs no change.
- 03da426: `runAsTenant` (`@stackra/tenancy/testing`) now sets `app.tenant_id` transaction-locally in every transaction that starts inside it on a connected database (a factory's flush, a `database.transaction`), so a test's setup rows pass the tenant policy under a role without `BYPASSRLS`, instead of being refused by row-level security. It still opens no transaction itself, sets no scope setting and proves nothing about isolation (`asTenant` does). The session-setting check allows this one testing path.
- Updated dependencies [82c2718]
- Updated dependencies [93d63bb]
- Updated dependencies [6186329]
- Updated dependencies [6186329]
- Updated dependencies [93d63bb]
- Updated dependencies [0a57fb3]
- Updated dependencies [3c47a3a]
- Updated dependencies [2e3e323]
- Updated dependencies [93d63bb]
- Updated dependencies [54aa1e7]
- Updated dependencies [4bf092e]
- Updated dependencies [93d63bb]
- Updated dependencies [41a5ff0]
- Updated dependencies [41a5ff0]
- Updated dependencies [0a57fb3]
- Updated dependencies [93d63bb]
- Updated dependencies [7d0e16f]
- Updated dependencies [6186329]
- Updated dependencies [52d2593]
- Updated dependencies [0f7448f]
- Updated dependencies [89253a8]
- Updated dependencies [c7144a0]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
  - @stackra/config@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/repo-checks@0.33.0
  - @stackra/gen@0.33.0
  - @stackra/runway@0.33.0
  - @stackra/console@0.33.0
  - @stackra/mcp@0.33.0
  - @stackra/skills@0.33.0
  - @stackra/validation@0.33.0
  - @stackra/support@0.33.0

## 0.32.0

### Patch Changes

- Updated dependencies [9ddce28]
- Updated dependencies [597e3e8]
- Updated dependencies [ba6eed7]
  - @stackra/config@0.32.0
  - @stackra/gen@0.32.0
  - @stackra/repo-checks@0.32.0
  - @stackra/runway@0.32.0
  - @stackra/mcp@0.32.0
  - @stackra/console@0.32.0
  - @stackra/skills@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/support@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [73ea174]
- Updated dependencies [5585893]
- Updated dependencies [2ba26cd]
- Updated dependencies [ebfd942]
- Updated dependencies [670f75c]
- Updated dependencies [137a7f9]
  - @stackra/gen@0.31.0
  - @stackra/runway@0.31.0
  - @stackra/repo-checks@0.31.0
  - @stackra/mcp@0.31.0
  - @stackra/console@0.31.0
  - @stackra/skills@0.31.0
  - @stackra/config@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/support@0.31.0
  - @stackra/validation@0.31.0

## 0.30.0

### Minor Changes

- 5b064da: New `stackra encore:prepare`: in a service, pins `encore.dev` to the default catalog's version and writes tsconfig `baseUrl` and `paths` from package.json `imports`, the two things Encore needs to build the app at the member root. Run `pnpm install` after a pin change.
- 0765ecc: Runway publishes a pull request's preview (STA-1907, ADR 0289 decision 7).
  
  - `publishProduct({ environment: "preview", pullRequest: n })` uploads the console bundle and writes
    `host:<product>-pr-<n>.figentra.cloud` and `release:<product>:console:pr-<n>`, both expiring after 7 days, with no canary; the
    answer carries `host`. A host row another product holds is refused before any upload. `pullRequestPreviewHost(product, n)` and `PULL_REQUEST_PREVIEW_SETTINGS` are exported.
  - `EdgeKvWriter.put(key, value, ttlSeconds?)` takes an optional expiry; `WranglerEdgeKvDriver` passes it as `--ttl`.
  - `EdgeKvWriter.read(key)` answers the row or `null`; every driver implements it (wrangler's `kv key get --text`,
    where the API's 404 is `null`).
  - The product command takes `--pr <n>` (or `STACKRA_PULL_REQUEST`) with `--env preview` (digits only), and prints the host.

### Patch Changes

- be079e7: `stackra testbed run` gives every health and slot probe a 60 s deadline, as `testbed` does since figentra/testbed#22.
  One box that keeps its SSH session open without answering (still booting, or a wedged Session Manager session) no
  longer stalls a waiting run forever: that box counts as unhealthy for one look, and the next look tries it again.
- c8e7592: `StoredSetting` and `StoredSettingRevision` are owned: both take `BelongsToTenantOrPlatform`, so a row's `tenant_id` is the running `withTenant` call's tenant, or NULL in a platform call. `@stackra/settings` now depends on `@stackra/tenancy`. The `settings:diff` and `settings:apply` runner writes through `TenantIsolationService.withTenant` as a system actor inside its `withScope` transaction, at a tenant node as that tenant and at the root or a product node as the platform, and no longer sets `app.tenant_id` itself. `@stackra/cli` drops the runner from `SESSION_SETTING_ALLOWED`.
- 11def65: The settings tables are tenant-owned in the platform form (migration `settings.0004_contract_settings_tenancy`):
  `stored_settings` and `stored_setting_revisions` get a nullable `tenant_id`, filled from `app.tenant_id` by default (a
  NULL row is the platform's), forced row-level security and the platform policies. The migration backfills a row at a
  tenant node (`nlevel(scope_path) = 3`) from its scope and keeps a row at the root or a product node as a platform row.
  A user's row is now keyed `(tenant_id, group_key, user_id)` (NULLs not distinct), and every user lookup names the
  session's own owner. New system function `settings.claim_due_revisions` (no runtime caller yet).
  
  The `settings:diff` and `settings:apply` runner (`openSettingsSession`) now sets `app.tenant_id` by the same rule: a
  tenant node is its own owner, the root and a product node are the platform's, and a node below a tenant node is refused
  (the runner cannot read its tenant without the scope tree yet). `@stackra/cli`'s session-settings check allows that one
  write.
  
  Upgrade: the migration refuses, changing nothing, while a setting or revision sits below a tenant node or belongs to a
  user (a user row names no scope, so its tenant cannot be read, and as a platform row every tenant could read it).
  Record those values, delete the rows (`nlevel(scope_path) > 3`, or `user_id is not null`) from both tables, migrate,
  then write the values again from a session in each node's or user's tenant.
- Updated dependencies [96b5241]
- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [04d04e4]
- Updated dependencies [0bf0a7f]
- Updated dependencies [7d60f82]
- Updated dependencies [418e195]
- Updated dependencies [e1e95d1]
- Updated dependencies [5b064da]
- Updated dependencies [dab9009]
- Updated dependencies [e1e1b5e]
- Updated dependencies [8c17109]
- Updated dependencies [ef49e63]
- Updated dependencies [5b064da]
- Updated dependencies [a3a3190]
- Updated dependencies [0765ecc]
- Updated dependencies [f4df473]
- Updated dependencies [cd2496b]
- Updated dependencies [d5a7d0a]
- Updated dependencies [15dba8d]
  - @stackra/gen@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/repo-checks@0.30.0
  - @stackra/runway@0.30.0
  - @stackra/console@0.30.0
  - @stackra/mcp@0.30.0
  - @stackra/skills@0.30.0
  - @stackra/config@0.30.0
  - @stackra/validation@0.30.0
  - @stackra/support@0.30.0

## 0.29.0

### Minor Changes

- 6f43cd8: `stackra constitution` writes `.flow/constitution.md` (the file Figentra Flow's `flow-*` commands read) from the docs
  laws, and `stackra validate --repository` reports it missing or out of date (`constitution`). It was rendered by core's
  agents-sync script, which retires now that Flow projects `.agents/` (STA-2098 H6).
  
  The stackra preset's workspace-layout rule and guard hint name the docs site as Fumadocs on a Worker (ADR 0514), not
  Mintlify.

### Patch Changes

- Updated dependencies [3361957]
- Updated dependencies [f069f95]
- Updated dependencies [edc2781]
- Updated dependencies [b26036e]
- Updated dependencies [8ad5f87]
- Updated dependencies [75ec6eb]
- Updated dependencies [856207e]
- Updated dependencies [1b727b9]
- Updated dependencies [45afd22]
- Updated dependencies [25b99da]
- Updated dependencies [6f43cd8]
  - @stackra/gen@0.29.0
  - @stackra/repo-checks@0.29.0
  - @stackra/runway@0.29.0
  - @stackra/console@0.29.0
  - @stackra/config@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/mcp@0.29.0
  - @stackra/skills@0.29.0
  - @stackra/contracts@0.29.0
  - @stackra/support@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [f0be8d8]
- Updated dependencies [7a87018]
  - @stackra/gen@0.28.0
  - @stackra/runway@0.28.0
  - @stackra/mcp@0.28.0
  - @stackra/console@0.28.0
  - @stackra/repo-checks@0.28.0
  - @stackra/skills@0.28.0
  - @stackra/config@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/support@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Patch Changes

- Updated dependencies [fb1ae38]
  - @stackra/gen@0.27.0
  - @stackra/runway@0.27.0
  - @stackra/mcp@0.27.0
  - @stackra/console@0.27.0
  - @stackra/repo-checks@0.27.0
  - @stackra/skills@0.27.0
  - @stackra/config@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/support@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Patch Changes

- Updated dependencies [e9d32d7]
- Updated dependencies [ec00fd8]
- Updated dependencies [081989b]
- Updated dependencies [b1603a7]
- Updated dependencies [5c0aafc]
- Updated dependencies [9b02a7c]
- Updated dependencies [15b5fd2]
  - @stackra/repo-checks@0.26.0
  - @stackra/gen@0.26.0
  - @stackra/runway@0.26.0
  - @stackra/mcp@0.26.0
  - @stackra/console@0.26.0
  - @stackra/skills@0.26.0
  - @stackra/config@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/support@0.26.0
  - @stackra/validation@0.26.0

## 0.25.0

### Minor Changes

- 8f8ddcf: System workers and pre-tenant routes can now find tenant rows before they know the tenant, through one narrow,
  audited way in (ADR 0239 amendment, gap A).
  
  A migration gives a tenant table `t.systemAccess({ select, update, reason })`. This lets the new
  `stackra_system_access` role read the `select` columns and write the `update` columns, and nothing else. The role
  cannot log in, does not bypass row-level security, and no one is a member of it, so no session can become it. The
  package then writes its lookup or claim with `schema.systemFunction({ name, args, returns, sql, reason })`. The
  function runs as that role with a fixed search path, returns only the columns it declares (ids and the tenant id),
  and only the service may call it. The worker then loads each row in that row's tenant.
  
  `assertRowSecurity`, and so every service's generated isolation test, refuses anything looser: a policy for anyone
  but the role, a member of the role, a role that bypasses row-level security, a grant beyond the declared columns, or
  a function that is not `SECURITY DEFINER`, does not pin its search path, or that anyone may call.
  `stackra row-security-declarations` lists both declarations with their reasons for review.
  
  Deployment: the database user that runs migrations needs `CREATEROLE` the first time a migration uses either
  declaration. A managed Postgres master user (RDS) has it; RUNWAY's deploy role must have it too.

### Patch Changes

- Updated dependencies [689c37b]
- Updated dependencies [8a8fa6f]
- Updated dependencies [e997ead]
  - @stackra/gen@0.25.0
  - @stackra/repo-checks@0.25.0
  - @stackra/runway@0.25.0
  - @stackra/mcp@0.25.0
  - @stackra/console@0.25.0
  - @stackra/skills@0.25.0
  - @stackra/config@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/support@0.25.0
  - @stackra/validation@0.25.0

## 0.24.0

### Minor Changes

- 2df7162: The row-security audit learns the group (c) decisions (ADR 0239 amendment).
  
  `assertRowSecurity` now accepts a table that keeps its tenant in `scope_id`, when its one permissive policy is exactly
  the `equals` or `equalsOrUnset` policy `t.rowLevelSecurity` writes on the tenant setting. It then checks that table
  like any owned one, with the two-tenant probe on `scope_id`. A looser policy, such as one that adds `or true`, or a
  second permissive policy, is still refused. Core payments' three tables pass this way, with no migration.
  
  Migrations gain two declarations, each with a required one-line reason:
  
  - `t.platformTable(reason)`: no row of this table can ever belong to a tenant. Compiling refuses it on a table that
    also writes a scope id, an isolation scope id, a column filled from a setting, or a policy. The audit refuses it once
    the table holds the tenant column, a scope id or an isolation scope id.
  - `t.reviewedPolicy(reason, policies)`: the table's policies have a reviewed shape the audit cannot derive. The audit
    still requires row-level security enabled and forced, and every named policy present. Only the tenant-policy checks
    and the probe are left out.
  
  The compiled migration carries each declaration as a comment line. Gen's generated isolation test now passes its
  migrations folder to the audit (`migrationsDirectory`), which reads them.
  
  `PLATFORM_TABLES` gains the platform-list tables: `outbox.inbox`, `outbox.change_cursors`, `queue.job_batches`,
  `scheduler.watermarks`, `workflow.service_ack_sets`, `rules.condition_fields`, `database.seed_records` and
  `scope.scope_nodes`, each with its reason.
  
  New command `stackra row-security-declarations` lists every declaration with its reason. It and
  `stackra validate --repository` fail on a declaration that is not in the reviewed list
  `tools/scripts/row-security-declarations.yaml` with that reason.

### Patch Changes

- Updated dependencies [35959f6]
- Updated dependencies [b4c2501]
- Updated dependencies [2df7162]
  - @stackra/gen@0.24.0
  - @stackra/runway@0.24.0
  - @stackra/mcp@0.24.0
  - @stackra/console@0.24.0
  - @stackra/repo-checks@0.24.0
  - @stackra/skills@0.24.0
  - @stackra/config@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/support@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Patch Changes

- c8998d9: A new service scaffolded outside a workspace now names `@electric-sql/pglite` 0.5.15 and `@electric-sql/pglite-pgvector`
  0.0.16, as the catalog does since PostGIS support.
- 4e4b61a: `stackra gen` and `stackra gen --check` at a workspace root now print the warnings of every member, also members
  that pass, and end with a line such as `gen: N warning(s) in M member(s)`. Before, a member's warnings only showed
  when that member failed. Warnings never change the exit code.
- a002570: The session-settings check now allows the shared replay of the `withScope` settings (used by a replica read and a
  `requiresNew` transaction) instead of the Postgres database driver, which no longer writes a setting itself.
- Updated dependencies [7ff4969]
- Updated dependencies [926faa4]
- Updated dependencies [96374f4]
- Updated dependencies [557809c]
- Updated dependencies [c26fb86]
- Updated dependencies [8b42c02]
- Updated dependencies [1083617]
- Updated dependencies [6edeee4]
- Updated dependencies [a2c8821]
- Updated dependencies [a42a80c]
- Updated dependencies [f790fa1]
- Updated dependencies [fb6e2b3]
  - @stackra/gen@0.23.0
  - @stackra/repo-checks@0.23.0
  - @stackra/runway@0.23.0
  - @stackra/mcp@0.23.0
  - @stackra/console@0.23.0
  - @stackra/skills@0.23.0
  - @stackra/config@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/support@0.23.0
  - @stackra/validation@0.23.0

## 0.22.0

### Patch Changes

- Updated dependencies [157ddff]
- Updated dependencies [e41d9a1]
- Updated dependencies [4663a61]
- Updated dependencies [3a9a6be]
  - @stackra/repo-checks@0.22.0
  - @stackra/gen@0.22.0
  - @stackra/runway@0.22.0
  - @stackra/mcp@0.22.0
  - @stackra/console@0.22.0
  - @stackra/skills@0.22.0
  - @stackra/config@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/support@0.22.0
  - @stackra/validation@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [2974e54]
- Updated dependencies [ae9cb23]
- Updated dependencies [d25a7a0]
- Updated dependencies [9feea9d]
- Updated dependencies [00a2477]
- Updated dependencies [a785356]
- Updated dependencies [f184d12]
- Updated dependencies [4242bbb]
  - @stackra/gen@0.21.0
  - @stackra/runway@0.21.0
  - @stackra/contracts@0.21.0
  - @stackra/validation@0.21.0
  - @stackra/mcp@0.21.0
  - @stackra/console@0.21.0
  - @stackra/repo-checks@0.21.0
  - @stackra/skills@0.21.0
  - @stackra/config@0.21.0
  - @stackra/support@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [671c9fd]
- Updated dependencies [3b48b0f]
- Updated dependencies [6623da1]
- Updated dependencies [667a3b5]
- Updated dependencies [a7b7e58]
- Updated dependencies [667a3b5]
  - @stackra/runway@0.20.0
  - @stackra/gen@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/mcp@0.20.0
  - @stackra/console@0.20.0
  - @stackra/config@0.20.0
  - @stackra/repo-checks@0.20.0
  - @stackra/skills@0.20.0
  - @stackra/contracts@0.20.0
  - @stackra/support@0.20.0

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

- 4069d77: The docs link check treats an HTML file under `assets/` (a brand email template with placeholder links) as a file the
  site serves, not a page: a link may point at it, and its own links are not checked.
- e105174: The infrastructure and developer packages describe sops and figentra/secrets instead of Infisical (ADR 0525).
  
  - `@stackra/infra-aws-runtime`: the RDS Proxy login secret's description names the vault, not Infisical, so the next
    apply updates that description in place. The docs name the vault and runway's secrets sync.
  - `@stackra/infra-tools`: the tools-stack secrets sync is the vault's (`secretsSync` keeps its shape: `source`,
    `principal`, `externalId`); the missing external id error names the secrets sync.
  - `@stackra/infra-github`, `@stackra/infra-cloudflare`, `@stackra/infra-identity`, `@stackra/infra-observability`,
    `@stackra/runway`, `@stackra/mcp`, `@stackra/cli`, `@stackra/fiscal`, `@stackra/licensing`: docs and comments only.
    `githubPlan` still turns `providers.infisical` into the `INFISICAL_*` CI variables until plan phase P6.
- 5d6448a: `stackra doctor` no longer checks for the Infisical CLI and login (ADR 0525). A workspace whose root scripts run
  `secrets-exec.mjs` is checked for the sops CLI, the Google Application Default Credentials file sops decrypts with
  (its presence only; the credential is never read) and a `figentra/secrets` clone with an `agents` folder. The
  `infisical` doctor need and the `DoctorWorkspace.infisical` field are gone. The testbed's toolchain test no longer
  expects the Infisical CLI in `mise.toml`; the boxes keep their own pin until they read sops.
- afd7846: Gen has warnings: a `GenError` with `severity: "warning"` prints as `<at> warning <code> ...` with its fix, never stops
  gen writing, and comes back in `warnings` from `generateMember` and `generate`; `stackra gen` and `stackra gen --check`
  print it and exit 0, while an error still exits 1. ADR 0101's checks run in the full pass as the new exported
  `checkActionFirst`: `action_without_workflow` warns an action that takes another service's client, a sibling module's
  service or `ConnectionStore` and starts no workflow, and `workflow_without_action` refuses a controller, command or
  listener that takes a workflow or `WorkflowRunner`, or starts a workflow itself. The source reader records the
  workflows a class starts as `DeclaredClass.workflows` (STA-340).
- 41dcbf6: `stackra testbed` defaults to the `figentra` AWS profile, which replaces the old `academorix` profile name for the same
  account. The key file keeps its live name; `STACKRA_TESTBED_AWS_PROFILE` still overrides the profile.
- Updated dependencies [58e3066]
- Updated dependencies [58a8fa5]
- Updated dependencies [2933e48]
- Updated dependencies [cb26737]
- Updated dependencies [bac874e]
- Updated dependencies [e105174]
- Updated dependencies [ee00741]
- Updated dependencies [5830168]
- Updated dependencies [ef04935]
- Updated dependencies [1cc3bd3]
- Updated dependencies [afd7846]
- Updated dependencies [0da5f7a]
- Updated dependencies [0921f1f]
- Updated dependencies [b800ae4]
- Updated dependencies [3aaf758]
- Updated dependencies [619099f]
- Updated dependencies [dd9427a]
- Updated dependencies [fc845f4]
- Updated dependencies [c239773]
- Updated dependencies [414586e]
- Updated dependencies [7a83de3]
- Updated dependencies [1f33c82]
- Updated dependencies [0e0de4f]
- Updated dependencies [0e0de4f]
  - @stackra/contracts@0.19.0
  - @stackra/gen@0.19.0
  - @stackra/runway@0.19.0
  - @stackra/config@0.19.0
  - @stackra/mcp@0.19.0
  - @stackra/repo-checks@0.19.0
  - @stackra/console@0.19.0
  - @stackra/skills@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/support@0.19.0

## 0.18.1

### Patch Changes

- Updated dependencies [2a7bc6d]
- Updated dependencies [baee3a3]
  - @stackra/gen@0.18.1
  - @stackra/runway@0.18.1
  - @stackra/mcp@0.18.1
  - @stackra/console@0.18.1
  - @stackra/repo-checks@0.18.1
  - @stackra/skills@0.18.1
  - @stackra/config@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/support@0.18.1
  - @stackra/validation@0.18.1

## 0.18.0

### Patch Changes

- Updated dependencies [15cd10c]
- Updated dependencies [79dcafb]
- Updated dependencies [dbf1c33]
  - @stackra/runway@0.18.0
  - @stackra/gen@0.18.0
  - @stackra/mcp@0.18.0
  - @stackra/console@0.18.0
  - @stackra/repo-checks@0.18.0
  - @stackra/skills@0.18.0
  - @stackra/config@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/support@0.18.0
  - @stackra/validation@0.18.0

## 0.17.2

### Patch Changes

- ff88313: `stackra deploy` takes `--from-env`: the secret sync it runs before services ship reads the job's environment (a
  decrypted sops scope, ADR 0525) instead of Infisical. And `--member` now always ships the named Worker members
  through the Workers provider: in a repository whose root runway has `surfaces` (core), a Worker deploy no longer runs
  the product publish or asks for `--assets-bucket`, `--assets-origin`, `--kv-namespace` and `--served`.
- 2da4d9d: Fixes from typechecking os on 0.17.1. Runway's eleven commands and `stackra runway` are `bin` commands, so no member
  hosts them (their classes are not exported from `@stackra/runway/node`), and gen hosts console commands only from a
  member's runtime `dependencies`, never its devDependencies. A hosted package's entities carry no `~defaults` marker its
  published types lack, and a package-base override no longer imports a field hatch it does not use.
- Updated dependencies [2da4d9d]
  - @stackra/gen@0.17.2
  - @stackra/runway@0.17.2
  - @stackra/mcp@0.17.2
  - @stackra/console@0.17.2
  - @stackra/repo-checks@0.17.2
  - @stackra/skills@0.17.2
  - @stackra/config@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/support@0.17.2
  - @stackra/validation@0.17.2

## 0.17.1

### Patch Changes

- @stackra/runway@0.17.1
  - @stackra/mcp@0.17.1
  - @stackra/console@0.17.1
  - @stackra/gen@0.17.1
  - @stackra/repo-checks@0.17.1
  - @stackra/skills@0.17.1
  - @stackra/config@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/support@0.17.1
  - @stackra/validation@0.17.1

## 0.17.0

### Minor Changes

- 4c6bf13: `stackra runway <command>` runs every Runway command (ADR 0529 decision 4): the same options, exit codes and `--json`
  output as the `runway` binary, which now prints a deprecation notice and stays only as an alias for one minor release.
  `@stackra/runway/node` exports `RUNWAY_COMMANDS`.

### Patch Changes

- Updated dependencies [a32f323]
- Updated dependencies [4c6bf13]
  - @stackra/repo-checks@0.17.0
  - @stackra/runway@0.17.0
  - @stackra/mcp@0.17.0
  - @stackra/console@0.17.0
  - @stackra/gen@0.17.0
  - @stackra/skills@0.17.0
  - @stackra/config@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/support@0.17.0
  - @stackra/validation@0.17.0

## 0.16.0

### Minor Changes

- 585f9de: `stackra validate --repository` checks the repository layout (ADR 0526): the root holds only its Flow preset's
  template entries, its member folders, `tools/` with a README and the extras package.json `stackra.layout.allow`
  declares with a reason; never a root `src/` or a `scripts/` or `bin/` folder, and no path named `figentra-flow`.

### Patch Changes

- e43a1a7: `stackra create` no longer copies the template's `.infisical.yaml` into a new app, so the app never binds
  Figentra's Infisical project; it sets up its own secrets.
- 64cfc1d: Cross-app events (ADR 0511 decisions 11 to 19, STA-1910). Gen lifts `client_event_remote_transport`: a listener of a
  contract-only producer's event is registered like a sibling's and delivered through a generated inbox, never an
  Encore subscription. Such a service gets `#stackra/inbox` (`InboundEventsController` on `POST /events/inbox` over
  `RelayInboxService`, and `RelayInboxConfig` with the pinned producers' public keys and events), its Encore `api.raw`
  adapter (`.stackra/encore/<member>/inbox.ts`, exposed, `auth: false`) and the boot's `RelayInboxService` connect. A
  service whose `runway.yaml` has an `events` block gets the manifest's `relay` section (keys and subscribers per
  environment, no origins), an `env` row for its signing key's secret name, `#stackra/events-relay`
  (`EventsRelayConfig` picked by `STACKRA_ENVIRONMENT`), the wiring of `CrossAppFanOut`, `CrossAppRelayService` and
  the Postgres `DeliveryDriver`, and the cross-app relay loop in its boot. The new warning `client_event_unsubscribed`
  names a listener whose producer's contract does not list the service for that event; `GenerateResult.warnings`
  carries it and `stackra gen` prints it. Members with neither keep the same output.
- Updated dependencies [89d4633]
- Updated dependencies [6ed8ab1]
- Updated dependencies [585f9de]
- Updated dependencies [31378e6]
- Updated dependencies [33c88a5]
- Updated dependencies [08be546]
- Updated dependencies [c6e4715]
- Updated dependencies [64cfc1d]
- Updated dependencies [5bf8ad3]
  - @stackra/runway@0.16.0
  - @stackra/gen@0.16.0
  - @stackra/repo-checks@0.16.0
  - @stackra/validation@0.16.0
  - @stackra/mcp@0.16.0
  - @stackra/console@0.16.0
  - @stackra/config@0.16.0
  - @stackra/skills@0.16.0
  - @stackra/contracts@0.16.0
  - @stackra/support@0.16.0

## 0.15.0

### Patch Changes

- @stackra/runway@0.15.0
  - @stackra/mcp@0.15.0
  - @stackra/console@0.15.0
  - @stackra/gen@0.15.0
  - @stackra/repo-checks@0.15.0
  - @stackra/skills@0.15.0
  - @stackra/config@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/support@0.15.0
  - @stackra/validation@0.15.0

## 0.14.4

### Patch Changes

- cc8dbb1: `stackra duplication` no longer counts committed generated files (`**/*.gen.ts`, such as `src/node/entities.gen.ts`)
  in a member's source run.
- Updated dependencies [fda1d53]
  - @stackra/runway@0.14.4
  - @stackra/mcp@0.14.4
  - @stackra/console@0.14.4
  - @stackra/gen@0.14.4
  - @stackra/repo-checks@0.14.4
  - @stackra/skills@0.14.4
  - @stackra/config@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/support@0.14.4
  - @stackra/validation@0.14.4

## 0.14.3

### Patch Changes

- Updated dependencies [3ccf74a]
- Updated dependencies [64e4840]
  - @stackra/runway@0.14.3
  - @stackra/mcp@0.14.3
  - @stackra/console@0.14.3
  - @stackra/gen@0.14.3
  - @stackra/repo-checks@0.14.3
  - @stackra/skills@0.14.3
  - @stackra/config@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/support@0.14.3
  - @stackra/validation@0.14.3

## 0.14.2

### Patch Changes

- @stackra/console@0.14.2
  - @stackra/gen@0.14.2
  - @stackra/runway@0.14.2
  - @stackra/config@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/mcp@0.14.2
  - @stackra/repo-checks@0.14.2
  - @stackra/skills@0.14.2
  - @stackra/contracts@0.14.2
  - @stackra/support@0.14.2

## 0.14.1

### Patch Changes

- 470d710: `stackra testbed` is deprecated in favour of `testbed` from `@figentra/testbed` (ADR 0522): it keeps working for
  one release, then goes (ADR 0522 step 8). Install `@figentra/testbed` and call `testbed`; the verbs, flags, exit codes
  and `--json` lines are the same.
  The preset's ci-steward and flow-gate command name `testbed run`.
- Updated dependencies [857a7fb]
  - @stackra/runway@0.14.1
  - @stackra/mcp@0.14.1
  - @stackra/console@0.14.1
  - @stackra/gen@0.14.1
  - @stackra/repo-checks@0.14.1
  - @stackra/skills@0.14.1
  - @stackra/config@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/support@0.14.1
  - @stackra/validation@0.14.1

## 0.14.0

### Patch Changes

- Updated dependencies [54e05c6]
  - @stackra/runway@0.14.0
  - @stackra/mcp@0.14.0
  - @stackra/console@0.14.0
  - @stackra/gen@0.14.0
  - @stackra/repo-checks@0.14.0
  - @stackra/skills@0.14.0
  - @stackra/config@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/support@0.14.0
  - @stackra/validation@0.14.0

## 0.13.0

### Patch Changes

- Updated dependencies [dc4b3f0]
- Updated dependencies [5d10209]
- Updated dependencies [6e61084]
  - @stackra/runway@0.13.0
  - @stackra/mcp@0.13.0
  - @stackra/console@0.13.0
  - @stackra/gen@0.13.0
  - @stackra/repo-checks@0.13.0
  - @stackra/skills@0.13.0
  - @stackra/config@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/support@0.13.0
  - @stackra/validation@0.13.0

## 0.12.0

### Patch Changes

- Updated dependencies [e36505c]
  - @stackra/runway@0.12.0
  - @stackra/mcp@0.12.0
  - @stackra/console@0.12.0
  - @stackra/gen@0.12.0
  - @stackra/repo-checks@0.12.0
  - @stackra/skills@0.12.0
  - @stackra/config@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/support@0.12.0
  - @stackra/validation@0.12.0

## 0.11.1

### Patch Changes

- 6212377: `stackra testbed` enables us-east-1, last (eu-west-1, eu-west-2, eu-central-1, us-east-1): box 1, whose on-demand
  quota it shared, is terminated (2026-11-06). As figentra/testbed#12.
- @stackra/console@0.11.1
  - @stackra/gen@0.11.1
  - @stackra/mcp@0.11.1
  - @stackra/repo-checks@0.11.1
  - @stackra/runway@0.11.1
  - @stackra/skills@0.11.1
  - @stackra/config@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/support@0.11.1
  - @stackra/validation@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [46951df]
  - @stackra/runway@0.11.0
  - @stackra/repo-checks@0.11.0
  - @stackra/mcp@0.11.0
  - @stackra/console@0.11.0
  - @stackra/gen@0.11.0
  - @stackra/skills@0.11.0
  - @stackra/config@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/support@0.11.0
  - @stackra/validation@0.11.0

## 0.10.0

### Minor Changes

- 242ebe4: Approvals and "CI only" are proved, never asserted (STA-2099 item 4). `proveGithubJob` asks the GitHub
  Actions runner for an OIDC token (audience `stackra-runway`), checks GitHub's RS256 signature, the issuer,
  the expiry and the repository, and, for an approval, that the job runs in that runway environment or in a
  GitHub environment `providers.github.environments` declares with reviewers. The deploy, promote and
  product deploy commands prove an environment's `deploy.approval` with it; `--approved` is still parsed
  and proves nothing. Reading runtime secrets from Infisical and `stackra mobile onboard --check|--live`
  need the proof instead of `GITHUB_ACTIONS=true`. A job needs `permissions: id-token: write`.

### Patch Changes

- 4b92f14: `stackra gen` at a workspace root skips a member that a filtered install left out (no `node_modules`), by
  name, instead of refusing every class it cannot resolve. The Quality Gate installs without the playground,
  so `//#gen:workspace` died on 297 `kind_unregistered_base` refusals there.
- a15cacf: A `ref:` Cloudflare account id in `runway.yaml` (`providers.cloudflare.accountId: ref:cloudflare.accountId`) no longer
  reaches wrangler as the account. The deploy job resolves a `ref:`, so the product publish and the edge KV writer now
  leave the job's `CLOUDFLARE_ACCOUNT_ID` in place, and refuse before any upload or KV write when the job has none
  (`RunwayUnresolvedError` names the variable). A literal id is set as before. Runway exports the decision as
  `cloudflareAccountEnv` (STA-2124).
- c4348cd: Runway's child-process helper is `runProgram` (was `runCommand`, file `run-program.function.ts`): a Command is a
  CLI command only (ADR 0294 d23), and `@stackra/console` exports `runCommand` (one symbol, one owner, d15). Behaviour
  unchanged. The duplicate-exports allowance for `runCommand` is gone.
- ff36aea: `stackra testbed run` runs the job detached on the box and follows its log, so a dropped SSH-over-SSM connection no
  longer kills a long job: it reattaches up to three times and takes the exit code from the box. Ctrl-C stops the job on
  the box. SSH keepalives notice a dead session in two minutes. `--postgres` asks the box for a throwaway Postgres. The default regions are eu-west-1, eu-west-2 and
  eu-central-1; us-east-1 joins once box 1 stops.
- f5fa82c: `stackra testbed run` no longer uploads a worktree's `.cache` (its pnpm store, about 7.5 GB); the box agent's seed
  refresh leaves it out too.
- 1c7ab2d: `stackra testbed run` exits 75 at once, with AWS's reason, when no enabled region answers (a bad or expired AWS
  profile), instead of waiting until the caller's own timeout; the GitHub fallback still goes first. As figentra/testbed#14.
- b503e30: `stackra testbed` finds the aws CLI's Session Manager plugin itself: on `PATH`, else the mise-installed copy
  (`mise which`, then mise's install folder), whose folder it puts first on `PATH` for the `aws` and `ssh` it starts.
  Without the plugin, `run` exits 75 at once and says why instead of waiting on "no healthy testbed box" while the boxes
  are healthy (what every run outside a mise-activated shell did from 2026-11-04), and `status` names the reason a box
  did not answer.
- Updated dependencies [a15cacf]
- Updated dependencies [4c0eead]
- Updated dependencies [4749967]
- Updated dependencies [f511762]
- Updated dependencies [e57b9a1]
- Updated dependencies [05da3d4]
- Updated dependencies [242ebe4]
- Updated dependencies [ea40871]
- Updated dependencies [0d65e3f]
- Updated dependencies [242ebe4]
- Updated dependencies [242ebe4]
- Updated dependencies [0d65e3f]
- Updated dependencies [c4348cd]
- Updated dependencies [0d65e3f]
- Updated dependencies [0d65e3f]
- Updated dependencies [0d65e3f]
- Updated dependencies [0d65e3f]
  - @stackra/runway@0.10.0
  - @stackra/gen@0.10.0
  - @stackra/config@0.10.0
  - @stackra/contracts@0.10.0
  - @stackra/repo-checks@0.10.0
  - @stackra/mcp@0.10.0
  - @stackra/console@0.10.0
  - @stackra/skills@0.10.0
  - @stackra/validation@0.10.0
  - @stackra/support@0.10.0

## 0.9.0

### Minor Changes

- b32691d: `stackra db migrate`, `db rollback`, `settings:diff`, `settings:apply`, `search:reindex`, `search:status`,
  `audit:verify` and `ops bootstrap-operator` are native console commands. Their flags, arguments, safety checks and exit
  codes are unchanged (a usage error exits 2, a refused rollback, a broken audit chain or a failed bootstrap exits 1), and
  each now takes `--json`: migrate and rollback return the environment and the migration names, the settings commands
  the node, environment and rows or revisions, the search commands the job or the indexes, `audit:verify` its report and
  `ops bootstrap-operator` the action's answer. The human output is the console's: success and info lines, lists, a
  settings-diff and search-status table, an audit checklist that only warns when the bundle's own keys were used, and a
  boxed problem for a refusal. `db seed` and `seed-pack` stay passthrough for now, so the seeders' output still streams
  as it runs.
- b0d6fcc: `stackra deploy --env <env>` syncs the services' secrets from Infisical into Encore before it ships, when the root
  runway says `secrets.sync: on-deploy` and the deploy includes services (STA-606). The sync runs inside the deploy lock,
  before the product publish and `deploy()`, so a missing secret ships nothing; `--dry-run` prints the sync's names and
  writers with the plan.
- 044e882: The repository checks `stackra any-ratchet`, `app-native-deps`, `cycles`, `duplicate-exports`, `doc-standard`,
  `catalogue-completeness`, `skill-licences`, `agents check`, `duplication` and `architecture-map --check` now run on
  `@stackra/console`: each finding is a failed checklist row (on standard output, with an "N errors" summary), a clean run
  prints one success line, `--json` writes `{ ok, data }` whose data is the findings array, and any finding still exits 1.
  The notes about lowered `any` baselines and stale duplicate-export allow-list entries are warnings on standard error.
  `stackra duplication --update` and `stackra architecture-map` say what they wrote, and `architecture-map` shows archify's
  output only when it fails, exiting with archify's code. `stackra structure` still prints the page unchanged (`{ page }`
  under `--json`) and `--write-docs` writes it. Every flag, positional and exit code is unchanged.
- 8345ace: `stackra gen` at a workspace root now writes Claude Code's `.claude/launch.json` and VS Code's `dev: <name>` tasks
  from the runways: one server per web surface of the root runway (built, then `stackra preview serve`) and one per app
  or Worker member with a dev port, each building first so it starts on a clean checkout. `stackra validate --repository`
  refuses a hand-edited or stale file and two servers on one port; `stackra gen --check` fails on a stale one.
- 630dc3f: `stackra ls`, `add`, `publish`, `agents sync`, `mcp sync`, `smoke`, `mobile onboard` and `consumer-gate` run as console command classes: the same flags, arguments and exit codes, with themed output and `--json` data (`ls` and `smoke` rows, the `add` item, the `consumer-gate` summary or setup error, the `mobile onboard` steps). `add` and `publish` run pnpm as a task instead of streaming it: its output shows under `--verbose`, its last 20 lines show under the task when it fails, and `publish` prints it when it ends. A failed pnpm run now exits 1 rather than with pnpm's own code.
- c0ff861: `stackra` now runs on `@stackra/console`. Help, `help <command>`, unknown commands (exit 2, with the closest names),
  errors and the version render through the console, so `-v` is `--verbose` and the version is `-V` or `--version`.
  `stackra doctor` is a grouped checklist (Machine, Tools, Repo, Registries, Accounts) whose `--json` output is the rows
  unchanged, `run` included, and a failed row exits 1. `stackra create` shows each step as a task (a failed step shows the
  tail of its output) and gen's summary as a tree. The local MCP serves `doctor` from its command definition. The
  other commands keep their flags and output unchanged and run as passthrough commands until they are converted.
- e9e8e89: Add `stackra promote --to <environment> [--from <environment>] [--sha <sha>] [--dry-run] [--approved]`, which ships what one environment runs to the next through runway's `promote()`, with the same approval check and deploy lock as `stackra deploy --env`.
- 2aeaec8: `writeDevFacts(root, lane)` in `@stackra/runway/node` writes `.stackra/dev/ports.json`, the file `readDevFacts` reads: each member runway's dev url, port, host, https, TLS files and Electron dev ports with the lane offset applied. `stackra dev` calls it before the member tool starts (lane from `STACKRA_LANE`, default 0). The app runway's `environments.<env>.desktop.devtools` is now read, so it leaves `RUNWAY_UNREAD_FIELDS` and its "Not read yet" schema note.
- 3db6529: The docs-site target can now write a Fumadocs site. `emitDocsSite(input, "fumadocs")` prerenders the site to static files with Vite and React Router. It writes the pages under `content/`, the navigation as a page tree in `app/site.json`, the site shell, `llms.txt`, `llms-full.txt` and `_redirects` under `public/`, and a transitional map for the Mintlify component names. It refuses a redirect from a page's own path (`docs_redirect_shadows_page`), a redirect to nowhere (`docs_redirect_target_missing`) and an unmapped, unimported component (`docs_component_unknown`). `DocsConfig` gains `redirects`. Mintlify stays the default until a docs app switches (STA-2026). For a docs member whose generated site is Fumadocs, `stackra dev` and `build` run React Router, and they name `pnpm install` when the site's dependencies are missing. `stackra lint` builds the site, then checks every internal link, image and anchor in it, and exits 1 naming each broken link by page.
- 5030040: The runway host map now generates the edge Worker's routes (`surfaceHosts`, `edgeRoutes`): one `<host>/*` per surface host under a runway zone, beside the stack's own patterns. A bare `*/*` route is refused unless the zone lists `exclusions`, which become script-less routes. The CLI's runway ship probes every host of the map after a product publish and fails when one does not serve TLS.
- b0d6fcc: The Cloudflare Workers provider reads each Worker's secrets from Infisical (`readMemberSecrets`) when it is given the
  runways, and sends them to `wrangler secret bulk` on stdin, after every value is read and before anything ships (STA-606).
  `stackra deploy` gives it the runways when the root runway says `secrets.sync: on-deploy`; without them the provider
  still reads the deploy job's environment.

### Patch Changes

- df5412b: `stackra duplicate-exports` (part of `stackra validate`) allows three intended copies, each with its reason:
  `ApprovalBinding` (the actions contract type and the tenancy model that stores it), `StepUpRequiredError` (the
  actions testing stand-in for identity's refusal) and `DatabaseRunner` (the shape the CLI loads at run time and the
  database package's runner) (STA-2079).
- cbbe4e3: Add the `docs` registry kind (STA-1920, ADR 0514 decision 10). `StackraKind.Docs` is a product's content-only docs
  package, `@figentra/<product>-docs`: MDX pages and their Fumadocs `meta.json` in `content/`, plus assets, with no code.
  `STACKRA_MANIFEST_SCHEMA` accepts `{ "kind": "docs" }` with nothing more. `pnpm validate` places a docs package at the
  repository's `docs/`, asks for no tier, turbo.jsonc or tsconfig, requires `content/`, and treats it as UNLICENSED like
  an app. `stackra add` never installs one: the docs hub depends on it.
- Updated dependencies [b210fc8]
- Updated dependencies [be4a198]
- Updated dependencies [9bb5d55]
- Updated dependencies [2aeaec8]
- Updated dependencies [3db6529]
- Updated dependencies [5030040]
- Updated dependencies [e80a99b]
- Updated dependencies [93bb1e7]
- Updated dependencies [c19ca9c]
- Updated dependencies [da0af20]
- Updated dependencies [b0d6fcc]
- Updated dependencies [2e43c48]
- Updated dependencies [2e43c48]
- Updated dependencies [ca1614e]
- Updated dependencies [c00ae11]
- Updated dependencies [502cba1]
- Updated dependencies [94354cc]
- Updated dependencies [dbe1e9d]
- Updated dependencies [b174a17]
- Updated dependencies [cbbe4e3]
- Updated dependencies [2ae4f65]
- Updated dependencies [f9c825d]
- Updated dependencies [75e94ff]
- Updated dependencies [bd3f314]
  - @stackra/gen@0.9.0
  - @stackra/console@0.9.0
  - @stackra/runway@0.9.0
  - @stackra/repo-checks@0.9.0
  - @stackra/validation@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/skills@0.9.0
  - @stackra/mcp@0.9.0
  - @stackra/config@0.9.0
  - @stackra/support@0.9.0

## 0.8.0

### Patch Changes

- 02c47c3: The product publish runs wrangler with `CLOUDFLARE_ACCOUNT_ID` from `providers.cloudflare.accountId` (uploads and KV
  rows), and `stackra deploy --product` passes `appLinks` from `STACKRA_APPLE_TEAMS` (`team=ID,...`) and
  `STACKRA_ANDROID_CERTIFICATES` (`app=AA:BB|CC:DD,...`). `CommandRunner` options take an `env`.
- Updated dependencies [928dcc0]
- Updated dependencies [7dd35b3]
- Updated dependencies [02c47c3]
- Updated dependencies [67e7e8f]
  - @stackra/gen@0.8.0
  - @stackra/runway@0.8.0
  - @stackra/repo-checks@0.8.0
  - @stackra/console@0.8.0
  - @stackra/config@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/mcp@0.8.0
  - @stackra/skills@0.8.0
  - @stackra/contracts@0.8.0
  - @stackra/support@0.8.0

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
