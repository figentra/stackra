# @stackra/cli

<!--
Stackra file contract:
Purpose: the package's reader guide: the `stackra` binary, its commands (gen's two passes included) and what is not
         here.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0083; ADR 0282 decision 3; ADR 0294; ADR 0260.
-->

The `stackra` binary (ADR 0083, ADR 0282 decision 3). It runs gen, runs each member's tools against the configs gen
writes, lists what a committed manifest locks, and wires the local developer MCP. It folds the old `console` CLI
framework (ADR 0127, 2026-10-24 note): a command is data plus one `run` function, parsed with `node:util`.

**Tier:** `tier:lib` (`packages/developer/cli`). No code entry: the package ships the `bin` only. Depends on
`@stackra/gen`, `@stackra/mcp`, `@stackra/repo-checks`, `@stackra/contracts` and `yaml`.

## Commands

| Command                                | Does                                                                                     |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| `stackra new <kind> <name>`            | a v3 `package` (`--category`), `service` (`--area`) or product `seed-pack`               |
| `stackra gen [--check] [--manifests]`  | gen-core on the member or every workspace member: manifests first, then the rest         |
| `stackra dev [--target <t>]`           | gen, then serve: Vite (web, PWA), Expo (iOS, Android), Wrangler, Encore, Mintlify        |
| `stackra build [--target <t>]`         | gen, then build: tsdown (package), Vite (web), `expo export` (native), Wrangler dry run  |
| `stackra start`                        | gen, then `vite preview` of an app's web build                                           |
| `stackra typecheck`                    | gen, then `tsc --noEmit`                                                                 |
| `stackra test [--tier unit\|e2e]`      | gen, then vitest (unit), Playwright (web and desktop e2e) or Maestro (native e2e)        |
| `stackra lint`                         | `oxlint .`                                                                               |
| `stackra check [flags]`                | the quality gate: every check phase in order at the workspace root (see below)           |
| `stackra validate`                     | `check --only config,structure,docs,catalogues,spec`                                     |
| `stackra verify`                       | `check --with-tests`                                                                     |
| `stackra code:check` / `code:fix`      | `check --only format,lint` (`code:fix` adds `--fix`)                                     |
| `stackra seed-pack <product>`          | check `seed-pack:<product>` (`--check`) or seed one `--profile` without touching tenants |
| `stackra settings:diff <pack.yaml>`    | what a settings pack would change at a scope node (`--scope-id`, `--scope-path`)         |
| `stackra settings:apply <pack.yaml>`   | apply a settings pack to a sandbox node as revisions (`--author`, `--reason`)            |
| `stackra ls [section]`                 | the identities a committed `stackra.manifest.json` locks (actions, events, permissions…) |
| `stackra mcp`                          | the local developer MCP over stdio; its tools run these commands in-process              |
| `stackra mcp sync`                     | render `.mcp.json` from `.mcp.yaml` (the template's `prepare`)                           |
| `stackra mcp exec [--env] [--path] --` | start an MCP server with its secrets, expanded by its own shell under `infisical run`    |
| `stackra agents sync`                  | write the project's generated agent files (`.mcp.json`)                                  |
| `stackra agents check`                 | fail when `.mcp.json` drifted from `.mcp.yaml`                                           |

At the workspace root (a folder with `pnpm-workspace.yaml`), `dev`, `build`, `start`, `typecheck`, `test` and `lint`
run `turbo run <task>` (`test:e2e` for `--tier e2e`); each member's script calls `stackra <task>` again.

Each tool gets `--config .stackra/<tool>.config.ts` when gen wrote it (ADR 0295 decision 5), and finds its own
member-root config otherwise. A task that no tool serves for the member (a desktop target, a service build before the
Encore target) is refused with the reason, never guessed. Exit codes: 0 success, 1 failure, 2 usage error, 127 a tool
that cannot start.

## The quality gate

`stackra check` runs the same way in core, in every product, in lefthook and in CI. Phases, in order: `config`,
`format` (oxfmt), `spelling` (cspell), `secrets` (gitleaks), `structure`, `docs`, `lint` (oxlint), `gen`
(`stackra gen --check`), `typecheck` (`turbo run typecheck`), `catalogues`, `spec` (the repository's spec gates) and,
opt-in, `test` (`turbo run test`). The `config`, `structure`, `docs` and `catalogues` checks come from
`@stackra/repo-checks`. The run stops after the first phase that fails. A phase whose tool is not installed in the
repository reports `skipped (not installed)`.

Flags: `--fix` (oxfmt writes, oxlint autofixes, `stackra gen` writes, then each checks again), `--affected` (only the
files changed since `--base`, default `origin/main`, plus staged, unstaged and untracked ones), `--only <phase,…>`,
`--skip <phase,…>`, `--with-tests`, `--format text|json|github` and `--base <ref>`.

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

## Settings packs

`stackra settings:diff <pack.yaml> --scope-id <scp_…> --scope-path <path>` hands the pack to the member's
`@stackra/settings/node` runner (`settingsDiff`) and prints each row it would change at that node.
`stackra settings:apply` (with `--author <id>` and an optional `--reason`) makes the node's own values equal the pack
through `settingsApply`: one sandbox revision per changed group, locks checked, and a group with a legal floor refused,
since the runner cannot see the holder's market (ADR 0395). Live configuration changes only by promotion.

## Not here yet

`stackra db diff` and `seed` land with `@stackra/database` in the data wave (ADR 0159 note). `stackra new` makes
packages, services and seed packs; app kinds stay with `pnpm new` until their templates move here. `structure`
(the docs page), `doctor` and `agents setup` move in from `tools/scripts` and their owning packages as those are built
(ADR 0282 consequences). Runway deploy locks for a settings apply are runway's (STA-779 hand-off). Figentra-internal
operations never ship here (ADR 0282 decision 4).
