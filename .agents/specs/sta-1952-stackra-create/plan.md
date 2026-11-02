# Implementation Plan: Engine proof, `stackra create`

**Spec**: `.agents/specs/sta-1952-stackra-create/spec.md` · **Linear**: STA-1952 · **Date**: 2026-11-02

## Summary

Phase 1 is one new `stackra create` command in `@stackra/cli`, one published artifact (`@stackra/starter`, built from
`figentra/stackra-template` with profiles), and the minimal profile's content in the template. Gen is used as it is.
Phases 2 to 4 are planned here and built only after phase 1 is green on a ci-box.

## What exists and is reused

| Piece                                                                         | Reused for                                                                                           |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `stackra-console create` (`packages/developer/console/.../create.command.ts`) | its flow: banner, refuse a non-empty folder, prompts with an `option` each, task lines, `--tarballs` |
| `@stackra/console/node` `terminalPrompter`                                    | the one prompter (no second one)                                                                     |
| `httpCatalogueClient` (`stackra add`)                                         | resolving and downloading the starter tarball with its SHA-512 integrity check, free then Pro        |
| `addCommand` resolution                                                       | the optional packages                                                                                |
| `workspaceTemplate`, `STACKRA_REGISTRY_NPMRC`                                 | pinning the `stackra` catalog to the CLI's version, the `.npmrc` scope line                          |
| `runGen`                                                                      | the gen run; it already prints the written files, `create` groups them                               |
| `tarballSpecs` (console)                                                      | `--tarballs <dir>` overrides                                                                         |

## Decisions

### D1. How the starter is fetched: a versioned `@stackra/starter` on the Stackra registry

Recommended. The template's release packs the template (git-tracked files plus `stackra.starter.yaml`) as the npm
package `@stackra/starter`, version-locked to the `@stackra/*` line it pins. `create` resolves `@stackra/starter` at
the CLI's own version through `httpCatalogueClient`, checks the integrity, and unpacks it in memory, filtered by
profile.

- **Why**: `@stackra` reads are open (ADR 0453 decision 10), so no token, no git and no GitHub access are needed; the
  starter and the CLI move together (a 0.5.1 CLI writes a 0.5.1 starter, never a newer `main`); integrity is checked
  by code that already exists; ci-boxes and the owner's Mac use the same path.
- **Rejected, git clone**: needs git and GitHub access to a repository the developer may not see, and follows `main`
  rather than the CLI's release, so an older CLI writes a starter it cannot generate.
- **Rejected, a GitHub release tarball**: the same access problem, and a second publishing channel beside the registry.
- **Kind or package**: a plain package (`stackra.kind: package`, never installed into a workspace) needs no change in
  `@stackra/skills`. A `starter` item kind is cleaner for the catalogue. Recommendation: plain package now; a kind later
  only if the catalogue needs to list starters.
- **The one-liner**: `@stackra` is not on npmjs, so the documented command is
  `npx --@stackra:registry=https://npm.stackra.figentra.com/ @stackra/cli create acme`; `create` writes the same scope
  line into the new app's `.npmrc`.

### D2. How the starter stays small: one template, profiles

The template gains `stackra.starter.yaml`:

```yaml
version: 1
profiles:
  minimal: # web console + one service with one module
    include:
      - "*" # root files
      - "apps/console/**"
      - "services/example/**"
      - ".github/**"
  full:
    include: ["**"]
```

A profile is a filter, never a copy. The template's CI runs `stackra create --starter . --profile <p> --yes` for both
profiles on every template pull request (install, gen, typecheck, tests), so a change that breaks either profile is red
before it merges. No second template exists to drift.

The minimal profile needs content the template lacks today: an `apps/console` member and one module in
`services/example/src/modules/notes/` (model, resource, `note.create`, `note.list`, one migration, tests). The template's
`example-drift.mjs` never compares `src/`, so the module does not fight it. This is the only template edit, after the
leader clears it (spec open question 1 decides app member or surface).

### D3. The questionnaire and its flags

| #   | Question                | Flag                   | Default            | Rule                                          |
| --- | ----------------------- | ---------------------- | ------------------ | --------------------------------------------- |
| –   | (folder)                | `<directory>`          | required           | missing or empty                              |
| 1   | What is the app called? | `--name`               | folder name, kebab | package-name pattern                          |
| 2   | Which npm scope?        | `--scope`              | `@<name>`          | `@kebab`                                      |
| 3   | Which edition?          | `--edition free\|pro`  | `free`             | `pro` only with `STACKRA_LICENCE_TOKEN`       |
| 4   | Any optional packages?  | `--packages a,b\|none` | none               | each resolves in the catalogue (multi-select) |
| 5   | Which package manager?  | `--pm pnpm`            | `pnpm`             | pnpm only (spec open question 2)              |

Not asked, flags only: `--profile minimal|full`, `--yes`, `--no-install`, `--no-check`, `--no-flow`, `--no-git`,
`--verbose`, `--starter <dir|tgz>`, `--tarballs <dir>`. Without a terminal nothing is asked and the defaults apply.

### D4. Where install and tests run

The same command does the same steps everywhere. On the owner's Mac, `create` installs and tests locally: it is their
machine and their choice. Agents never run it on the Mac: they verify on a ci-box with `ci-box run`, from packed
tarballs before a release (`--starter <tgz> --tarballs <dir>`, the STA-1730 pattern) and from the registry after one.
After phase 1, a `create-smoke` job in core's Quality Gate runs the `--tarballs` path in a temporary folder, so a CLI or
gen change that breaks `create` is caught in core, not by the owner.

### D5. How gen's output is shown

`runGen` already reports the written paths. `create` passes them to a pure `genTree(paths)`, which groups them by member
and by kind folder and prints one line each, with a count and what it is:

```text
Generated by stackra gen
├─ services/example
│  ├─ stackra.manifest.json      the contract: 2 actions, 1 model, 1 resource
│  ├─ .stackra/gen/               schemas, wiring, permissions, clients (8 files)
│  ├─ .stackra/encore/            the Encore app: 1 service, 2 endpoints (6 files)
│  └─ .stackra/entry/node.ts      the entry
└─ apps/console
   ├─ .stackra/gen/               routes, navigation, resources, clients (6 files)
   └─ .stackra/entry/browser.ts   the entry
```

`--verbose` prints every file under its line. If `runGen` does not return the paths today, the change is in
`@stackra/cli`'s `runGen` (return what it prints), never in `@stackra/gen`.

## Pull requests (phase 1)

| PR  | Repository | Change                                                                                                   | Checked by                                                                  |
| --- | ---------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | core       | this spec, plan and tasks; the reserved ADR "`stackra create` and the published starter"                 | spec gate                                                                   |
| 2   | template   | `stackra.starter.yaml`, `apps/console`, the `notes` module, the `@stackra/starter` pack and publish step | template CI; leader clears it first                                         |
| 3   | core       | `stackra create`: flags, questions, starter reader (`--starter` first), rename, install, gen, tree       | unit tests (`genTree`, rename, profile filter); ci-box run with `--starter` |
| 4   | core       | registry fetch through `httpCatalogueClient`, optional packages, typecheck and tests, Flow, git, resume  | ci-box run from packed tarballs                                             |
| 5   | core       | `create-smoke` in the Quality Gate; docs page `create` in `apps/docs`                                    | Quality Gate                                                                |

PR 3 needs no published starter: `--starter <dir>` reads a template checkout on the ci-box, so core work starts while
the template PR is in review. Phase 1 is done when, after `@stackra/starter` is published, a fresh ci-box folder runs
`npx … @stackra/cli create /tmp/acme --yes` to green and the log with the tree is on STA-1952.

## Phases 2 to 4 (planned, built after phase 1 is green)

- **Phase 2, dev.** `stackra dev` at the root of a created app serves `apps/console` and the service through the
  generated Encore app (`encore run` in `.stackra/encore/`). Gap to confirm: today `stackra dev` is the member tool
  command plus the surface, mobile and product modes; a root run that starts every member is new. The resource page
  waits on STA-1947 (gen-ui-2c), through the leader. Done: Playwright on a ci-box, zero console errors, the resource
  list shows, `note.create` adds a row.
- **Phase 3, deploy.** The minimal profile's `runway.yaml` declares one `dev` environment (Encore Cloud for the service,
  Cloudflare for the console). The agent runs `stackra deploy --env dev --dry-run` on a ci-box and writes the owner's
  checklist: the accounts, the Encore app link, the Cloudflare zone, the secret names in Infisical. The owner runs the
  deploy.
- **Phase 4, change.** `stackra new` cannot add a module in a product repository today (template kinds read
  `tools/scaffold/templates` from core only; `new service` writes no `src/`). A follow-up issue ships the templates in
  `@stackra/cli` and adds a `module` kind. Then: add a module, `stackra gen`, tests, dry run, owner redeploy.

## Constitution Check

| Law                                   | Result | Note                                                                                                   |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | `@stackra/cli` → `@stackra/console`, both `tier:lib` developer; console does not import cli (no cycle) |
| Secrets (ADR 0173)                    | PASS   | no value read or written; the licence token's presence only, sent to the registry origin only          |
| Security                              | PASS   | integrity-checked tarball; writes only inside the target folder; refuses a non-empty folder            |
| HTTP and events                       | PASS   | the starter's module follows the endpoint convention; gen derives the routes                           |
| Tenancy                               | N/A    | the example table is not tenant-owned (open question 4)                                                |
| Not built yet (ADR 0227)              | PASS   | nothing new; pnpm, Encore generated, MikroORM migrations                                               |
| Test placement (ADR 0022)             | PASS   | `packages/developer/cli/src/node/create/**/__tests__/`                                                 |
| Versions and catalogs                 | PASS   | `workspace:*` only; the starter's `stackra` catalog is pinned to the CLI's exact version               |
| Docs and ADRs                         | PASS   | one ADR (reserved first), a `create` docs page                                                         |

## Risks

- The starter's module meets a gen refusal in 0.5.1: reported to the leader as a gen issue; phase 1 waits for it.
- The template changes under the Flow wave while PR 2 is open: PR 2 is small and rebased; the leader sequences it.
- The owner's Mac lacks pnpm 12 or Node 24: `create` checks both first and prints the fix.
