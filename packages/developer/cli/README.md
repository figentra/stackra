# @stackra/cli

<!--
Stackra file contract:
Purpose: the package's reader guide: the `stackra` binary, its commands (gen's two passes included) and what is not
         here.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0083; ADR 0282 decision 3; ADR 0294; ADR 0260; ADR 0349 (member names); ADR 0453 (add,
                    publish).
-->

The `stackra` binary (ADR 0083, ADR 0282 decision 3). It runs gen, runs each member's tools against the configs gen
writes, lists what a committed manifest locks, and wires the local developer MCP. It folds the old `console` CLI
framework (ADR 0127, 2026-10-24 note): a command is data plus one `run` function, parsed with `node:util`.

**Tier:** `tier:lib` (`packages/developer/cli`). No code entry: the package ships the `bin` only, and its `exports` map
holds `./package.json` alone, so `import "@stackra/cli"` is refused by Node and by bundlers. Depends on
`@stackra/gen`, `@stackra/mcp`, `@stackra/repo-checks`, `@stackra/skills` (its `./contracts`), `@stackra/contracts`
and `yaml`.

## Commands

| Command                                | Does                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| `stackra new <kind> <name>`            | a v3 `package` (`--category`), `service` (`--area`) or `seed-pack`; `--scope`, `--over`      |
| `stackra gen [--check] [--manifests]`  | gen-core on the member or every workspace member: manifests first, then the rest             |
| `stackra dev [--target <t>]`           | gen, then serve: Vite (web, PWA), Expo (iOS, Android), Wrangler, Encore, Mintlify            |
| `stackra dev --surface <surface>`      | a product surface in its real shell (published or `--os` checkout), Vite with hot reload     |
| `stackra dev --mobile <app> --os <c>`  | a product mobile app from its template line, Release build on the iOS simulator (`--device`) |
| `stackra dev --product --os <c>`       | every surface and mobile app of the root runway at once                                      |
| `stackra build [--target <t>]`         | gen, then build: tsdown (package), Vite (web), `expo export` (native), Wrangler dry run      |
| `stackra build --product [--dry-run]`  | a product's surface bundles and mobile EAS builds, and `dist/product/build.json`             |
| `stackra deploy --product --env <e>`   | publish a built product: bundles and host rows to the edge, mobile builds to the stores      |
| `stackra start`                        | gen, then `vite preview` of an app's web build                                               |
| `stackra typecheck`                    | gen, then `tsc --noEmit`                                                                     |
| `stackra test [--tier unit\|e2e]`      | gen, then vitest (unit), Playwright (web and desktop e2e) or Maestro (native e2e)            |
| `stackra lint`                         | `oxlint .`                                                                                   |
| `stackra check [flags]`                | the quality gate: every check phase in order at the workspace root (see below)               |
| `stackra validate`                     | `check --only config,structure,docs,catalogues,spec`                                         |
| `stackra verify`                       | `check --with-tests`                                                                         |
| `stackra code:check` / `code:fix`      | `check --only format,lint` (`code:fix` adds `--fix`)                                         |
| `stackra seed-pack <product>`          | check `seed-pack:<product>` (`--check`) or seed one `--profile` without touching tenants     |
| `stackra settings:diff <pack.yaml>`    | what a settings pack would change at a scope node (`--scope-id`, `--scope-path`)             |
| `stackra settings:apply <pack.yaml>`   | apply a settings pack to a sandbox node as revisions (`--author`, `--reason`)                |
| `stackra search:reindex [Model]`       | queue a resumable search reindex job (`--scope-id`/`--scope-path`, `--since`, `--semantic`)  |
| `stackra search:status`                | each search index's state, document count and rebuild progress                               |
| `stackra ls [section]`                 | the identities a committed `stackra.manifest.json` locks (actions, events, permissions…)     |
| `stackra mcp`                          | the local developer MCP over stdio; its tools run these commands in-process                  |
| `stackra mcp sync`                     | render `.mcp.json` from `.mcp.yaml` (the template's `prepare`)                               |
| `stackra mcp exec [--env] [--path] --` | start an MCP server with its secrets, expanded by its own shell under `infisical run`        |
| `stackra agents sync`                  | write the project's generated agent files (`.mcp.json`)                                      |
| `stackra agents check`                 | fail when `.mcp.json` drifted from `.mcp.yaml`                                               |
| `stackra add <kind> <name>[@version]`  | install a registry skill, agent, MCP server, plugin or package (see below)                   |
| `stackra publish [--dry-run]`          | check the member's `stackra.kind` and name, then `pnpm publish` to the Stackra registry      |

At the workspace root (a folder with `pnpm-workspace.yaml`), `dev`, `build`, `start`, `typecheck`, `test` and `lint`
run `turbo run <task>` (`test:e2e` for `--tier e2e`); each member's script calls `stackra <task>` again.

`stackra dev --surface <surface>` runs at a product root (ADR 0436 decision 6, app-shells section 15 point 2). It reads
`surfaces.<surface>` (`shell: os/console@3`, `packages`) from the root `runway.yaml`, runs `stackra gen`, writes the
`DevSurface` descriptor to `.stackra/surfaces/<surface>/dev-surface.json`, then starts Vite with the surface's
bundle-mode config (`.stackra/surfaces/<surface>/vite.config.ts`, written by gen's bundle mode). The shell is the
published version at `<--shell-origin or STACKRA_SHELL_ORIGIN>/<owner>/<name>@<version>/` (`--shell` pins a version
inside the surface's line), or with `--os <checkout>` the checkout's `apps/<name>` started with `stackra dev` on its
`environments.dev.port`. The API is `--api`, else `http://localhost:<environments.dev.infra.gateway.port>/`. The Vite
config reads the descriptor to build the page's import map (shell and shared dependencies from the shell URL, the
product bundle from Vite with hot reload) and to proxy the API.

With `--os <checkout>` the shell is that checkout's own Vite on its `runway.yaml` dev port, and it serves the product
packages' `./<surface>` entries from source with the descriptor (`STACKRA_DEV_SURFACE`); no bundle-mode config is
needed. `stackra dev --mobile <app> --os <checkout> --device <udid>` prepares `.stackra/mobile/<app>` with Runway's
`prepareMobileDev`, then `expo prebuild` and a Release `expo run:ios` with no bundler; `stackra dev --product` runs
them all.

## A product's CI: build and deploy

A product with no app members (ADR 0441 decision 2) builds and deploys with two commands, which its CI calls:

- `stackra build --product [--dry-run] [--os <checkout>] [--scope <@scope>] [--env <environment>]` checks every
  surface's shell line and every app's template line out (from the registry, or `--os`), builds each surface's
  extension bundle with Vite against the shell's import map into `dist/bundles/<surface>/<sha12>/`, writes each app's
  config with only its capability flags and its packages built in and starts its EAS build, and writes
  `dist/product/build.json`. `--dry-run` plans the bundles and records the EAS builds. The lines' scope is `--scope`,
  else `STACKRA_LINE_SCOPE`, else the scope of the product's own packages.
- `stackra deploy --product --env <dev|preview|staging|production> [--dry-run] [--approved] [--first-release]`
  publishes what was built: the bundles to the asset store and the `host:`, `wellknown:` and `release:` or `canary:`
  rows (wrangler), the landing seed documents listed, and each app's EAS builds submitted under its store accounts. The
  OS facts come from the deploy job: `--assets-bucket`, `--assets-origin`, `--kv-namespace`, `--served`,
  `--canary-scopes`, `--region` or their `STACKRA_*` variables. An environment whose runway names an approval
  (`deploy.approval: github-environment`) deploys only with `--approved`, which the job behind that GitHub environment
  passes. `dist/product/deploy-<env>.json` records what was done (or, in a dry run, planned).

Each tool gets `--config .stackra/<tool>.config.ts` when gen wrote it (ADR 0295 decision 5), and finds its own
member-root config otherwise. A task that no tool serves for the member (a desktop target, a service build before the
Encore target) is refused with the reason, never guessed. Exit codes: 0 success, 1 failure, 2 usage error, 127 a tool
that cannot start.

## Registry items

The Stackra registry (ADR 0453) holds packages and items of four more kinds, each an npm tarball whose `package.json`
carries `"stackra": { "kind": … }` (the shapes and schemas are `@stackra/skills/contracts`).
`stackra add <kind> <name>[@version|@tag]` looks up `@stackra/<kind>-<name>`, then `@stackra-pro/<kind>-<name>`, in
the catalogue API, checks the tarball against its integrity, and installs it:

| Kind      | Goes to                                                                 |
| --------- | ----------------------------------------------------------------------- |
| `skill`   | `.agents/skills/<name>/` (the tarball must hold `SKILL.md`)             |
| `agent`   | `.agents/agents/<name>.md` (from the tarball's `agent.md`)              |
| `mcp`     | `mcpServers.<name>` in `.mcp.yaml`, from `stackra.mcp`; then `mcp sync` |
| `plugin`  | `.agents/plugins/<name>/`                                               |
| `package` | `pnpm add @stackra/<name>` (or `@stackra-pro/<name>`); pinned by pnpm   |

Every non-package install is pinned by name, version, integrity and target in `stackra-items.lock.yaml` at the
workspace root. A target that exists but is not in the lock (a hand-written skill of the same name) is refused, never
overwritten. The registry is a setting: `--registry`, else `STACKRA_REGISTRY`, else the `@stackra:registry` line of
the workspace `.npmrc`, else `https://npm.stackra.figentra.com/`. `@stackra-pro` items read `STACKRA_LICENCE_TOKEN`.

`stackra publish` refuses a member whose `stackra` field is invalid, whose scope is not `@stackra` or `@stackra-pro`,
whose name is not `@<scope>/<kind>-<name>` for its kind (or is, for a package), or that lacks `SKILL.md` (skill) or
`agent.md` (agent); then it runs `pnpm publish --registry <registry>`. Only the release workflow publishes, with the
token of its OIDC exchange (ADR 0453 decision 6); the registry Worker runs the licence and provenance checks.

## The quality gate

`stackra check` runs the same way in core, in every product, in lefthook and in CI. Phases, in order: `config`,
`format` (oxfmt), `spelling` (cspell), `secrets` (gitleaks), `structure`, `docs`, `lint` (oxlint), `gen`
(`stackra gen --check`), `typecheck` (`turbo run typecheck`; `tsc --noEmit -p <member>` per member when turbo is
absent or refuses a dependency cycle), `catalogues`, `spec` (the repository's spec gates) and,
opt-in, `test` (`turbo run test`). The `config`, `structure`, `docs` and `catalogues` checks come from
`@stackra/repo-checks`. The run stops after the first phase that fails, unless `--keep-going` (every phase runs, so a baseline is one call).
A finding two tools report for the same file under the same meaning (gen `two_declarations_in_file` and lint
`stackra(one-declaration-per-file)`) is reported once, by the earlier phase, noting the later tool agrees; the pairs
live in `SAME_MEANING_RULES`. A phase whose tool is not installed in the
repository reports `skipped (not installed)`.

Flags: `--fix` (oxfmt writes, oxlint autofixes, `stackra gen` writes, then each checks again), `--affected` (only the
files changed since `--base`, default `origin/main`, plus staged, unstaged and untracked ones), `--only <phase,…>`,
`--skip <phase,…>`, `--with-tests`, `--keep-going`, `--format text|json|github` and `--base <ref>`.

Output: one line per finding, `path:line:col  tool/rule  message  [fixable]`, grouped by phase, then a table of phase,
status, findings, fixable count and duration. `--format json` prints only the findings array
(`{ phase, tool, rule, path, line, column, message, severity, fixable, adr }`); `--format github` prints `::error`
annotations, then the table. The exit code is 1 when any phase has an error-level finding. A warning never fails.

## Seed packs

A product's defaults are data, not code (owner principle "configuration, not code"; config-model section 6). Each
product keeps one `seed-pack:<product>` in `seed-packs/<product>/` of its repository: `seed-pack.yaml` (`key`,
`product`, a semantic `version`) and one YAML document per record under `profiles/minimal`, `profiles/demo` and
`profiles/test` (ADR 0190). A document has a `kind` (settings, rule-set, workflow-template, studio-template,
role-template, industry-template, checklist-template, plan-catalogue, price-list, offer, fee-schedule, rate-card,
connector-catalogue, brand-kit), the record `key` and `rows`; every row has an `id` and the `answer` id it encodes (`COM-160`), so a changed answer changes one row.

- `stackra seed-pack <product> --check` reads the pack and refuses it with every issue (`seed_pack_header`,
  `seed_profile_unknown`, `seed_kind_unknown`, `seed_record_key_missing`, `seed_record_duplicate`,
  `seed_row_id_missing`, `seed_row_duplicate`, `seed_row_answer_missing`).
- `stackra seed-pack <product> [--profile minimal|demo|test] [--env <e>]` loads `minimal` (then `demo` or `test`),
  asks the member's `@stackra/database/node` runner what it stores (`seedState`), and writes (`applySeed`) only new
  records and seed-owned records whose content hash changed. A record a tenant changed is kept: a new seed version
  only changes the product default underneath.
- `stackra new seed-pack <product>` writes the header and the three profile folders.

## New members

`stackra new package|service <name>` writes the stackra/template shape: `#src/*` and `#assets/*` imports, the
`./assets/*` export, an `assets/` folder, and `@stackra/*` at `catalog:stackra` when the workspace declares that
catalog (`workspace:*` in this repository). The published name follows ADR 0349 decision 2:

| Given                                     | Package                      | Service                              |
| ----------------------------------------- | ---------------------------- | ------------------------------------ |
| `--scope @acme`                           | `@acme/<name>`               | `@acme/service-<name>`               |
| `--scope <product>` or root `product.key` | `@figentra/<product>-<name>` | `@figentra/<product>-service-<name>` |
| neither (this repository, the OS)         | `@stackra/<name>`            | `@figentra/service-<name>`           |

`--over` regenerates over an existing member: it writes only the files that are missing and prints a line diff for
each authored file that differs from the template, without writing it. It never writes or diffs `CHANGELOG.md` or an
existing `runway.yaml` (ports and sizes are authored), and the templates write nothing under `src/`, so
`src/modules/` and an authored root module are never touched.

## Settings packs

`stackra settings:diff <pack.yaml> --scope-id <scp_…> --scope-path <path>` hands the pack to the member's
`@stackra/settings/node` runner (`settingsDiff`) and prints each row it would change at that node.
`stackra settings:apply` (with `--author <id>` and an optional `--reason`) makes the node's own values equal the pack
through `settingsApply`: one sandbox revision per changed group, locks checked, and a group with a legal floor refused,
since the runner cannot see the holder's market (ADR 0395). Live configuration changes only by promotion.

## Search indexes

`stackra search:reindex [Model]` hands the request to the member's `@stackra/data-maintenance/node` runner
(`searchReindex`), which queues one reindex job (`data_maintenance.index.reindex`, or
`data_maintenance.index.reindex_semantic` with `--semantic`) in the member's queue and returns; the member's workers run it, where its `@Searchable`
models are registered. No model reindexes every registered one; `--scope-id`/`--scope-path` run it in that scope (else
platform-wide); `--since <ISO 8601>` indexes only rows updated since then; `--semantic` backfills the vector passages
instead. A full rebuild records its cursor in `search.indexes`, so a stopped one resumes. `stackra search:status`
prints each index's state (`valid`, `invalid` after a facet change, `rebuilding`), document count, resume cursor and
last rebuild (`searchStatus` of `@stackra/search/node`). Both connect with `directDatabaseUrl()` of `@stackra/database/node`: the member's
`DATABASE_DIRECT_URL`, else its `DATABASE_URL` (ADR 0473).

## Not here yet

`stackra add` does not list or search the catalogue yet (`GET /-/stackra/v1/catalogue`), and `stackra publish` does
not attach the provenance bundle; the release workflow does (stackra-185). `stackra whoami` (entitlements) is not
built.

`stackra db diff` and `seed` land with `@stackra/database` in the data wave (ADR 0159 note). `stackra new` makes
packages, services and seed packs; app kinds stay with `pnpm new` until their templates move here. `structure`
(the docs page), `doctor` and `agents setup` move in from `tools/scripts` and their owning packages as those are built
(ADR 0282 consequences). Runway deploy locks for a settings apply are runway's (STA-779 hand-off). Figentra-internal
operations never ship here (ADR 0282 decision 4).
