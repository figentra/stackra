# Stackra: state of the repository

Dated 2026-11-07. A snapshot, not a rule book: each line names its evidence. Where this file and another
document disagree on a fact, the evidence named here wins; rules still live in `AGENTS.md` and the ADRs.

## 1. What this repo is

Stackra is a TypeScript framework shipped as the `@stackra/*` packages, plus the tooling around it: `stackra gen`
(generates the Encore app), the `stackra` CLI, the Runway deploy layer, the Figentra Flow preset and the docs site.
The apps, services and workers here are small reference members and the hosting for the registry, docs and caches;
no product feature lands here. It is built by AI agent lanes (as the `stackra-bot` GitHub App) under the owner
`figentra-usr`, who approves production environments.

## 2. Current

- Default branch `main`, head `1da9e65731d63e5de063783647ceaaab40eedb43` (2026-11-07 04:52Z, "docs(adr): retire
  the on-premises Infisical pull-at-boot driver (0525, 0371) (#621)").
- Packages: 119 `@stackra/*` members under `packages/<category>/<name>` in 14 categories; 118 public at
  **0.18.1**, 1 private (`@stackra/showcase`, 0.0.0). Apps, services and workers are private at 0.0.1.
- Root `package.json` is private 0.0.0. Versions come only from the `pnpm-workspace.yaml` catalogs
  (`catalogMode: strict`).
- Toolchain (`mise.toml`, `package.json`, catalogs): Node 24.22.0, pnpm 12.16.1, Turborepo 2.11.9,
  TypeScript 6.0.3 / 7.0.2, tsdown 0.23.1, vitest 5.0.5, oxlint 1.86.0, oxfmt 0.71.0, lefthook 2.2.1,
  changesets 3.0.3, wrangler 4.148.0, gitleaks 8.30.1, sops 3.10.2, age 1.2.1, Figentra Flow `@figentra-oss/flow` 0.6.5 (`fflow`, stackra preset).

## 3. Proven by a real run

- **Release to the Stackra registry.** 118 GitHub releases `@stackra/*@0.18.1` created 2026-11-07 03:54Z to 04:16Z from
  "chore(release): version packages (#616)" (`f8489905`); `release.yml` passed on main (runs 42336073228 and
  42338715644). `https://npm.stackra.figentra.com/@stackra%2fstate` answers 200 with `latest: 0.18.1`.
- **Registry Worker deploy.** `deploy-registry.yml` run 42336872873 succeeded on main 2026-11-07
  (`f8489905`); `https://npm.stackra.figentra.com/-/ping` answers 200.
- **Turbo cache Worker deploy.** `deploy-turbo-cache.yml` run 42336910740 succeeded on main 2026-11-07.
- **Static Worker deploy.** `deploy-static.yml` run 42332325582 succeeded on main 2026-11-07;
  `https://static.stackra.figentra.com/` answers 200.
- **Docs site.** Last `deploy-docs.yml` success on main is run 41416061061 (2026-11-02, `67022c00`);
  `https://docs.stackra.figentra.com/` answers 200 with title "Introduction - Stackra". HTTP and title only;
  no browser render was checked.
- **Flow baseline and CodeQL.** `fflow-baseline.yml` (run 42338715518) and CodeQL (run 42338715152) pass on
  main at `58a8fa5f`.
- **Testbed apply.** `apply-testbed.yml` run 42202691149 succeeded on main 2026-11-06.
- **Linear sync.** `linear-sync.yml` run 42205965512 succeeded on main 2026-11-06.

## 4. Not proven

- **The Quality Gate (`ci.yml`).** It runs on pull requests and manual dispatch. Its last success is run
  41179552309 (a push to main, 2026-10-31, `d70b2843`, before pushes stopped triggering it); every run since
  fails. Latest cause (run 42339257875):
  `pnpm format:check` finds 4 unformatted files on main (`.vscode/tasks.json` and three files under
  `packages/developer/runway/src/node/`), so no pull request can pass.
- **Tests.** Under the merge-now rule (STA-2083) GitHub CI runs no tests and nothing tests on a workstation;
  tests run later on the testbed. No test result is recorded in this repository, so no package's tests are
  proven at this head.
- **Runway workflows never ran:** `runway-cloudflare-workers.yml`, `runway-npm.yml`, `runway-smoke.yml`,
  `runway-store.yml`, `fflow-approve.yml` have no runs. `runway-drift.yml` has never passed (last: run
  42205544196, failed at "Read-only Cloudflare token (Infisical OIDC)"); it now reads sops, not yet run.
- **Observability.** `apply-observability.yml` has never passed (run 42336073171 failed at "Pulumi up").
- **Testbed image and fallback.** `testbed-image.yml` has never passed on main (it passed on a PR branch, run
  42330185147); `testbed-fallback.yml` has never passed.
- **Workers without a deploy workflow run here:** `workers/edge` (`workers/env-sync` is removed: ADR 0525 retired
  it).
- **Docs deploy at head.** `deploy-docs.yml` runs 42338715844 (waiting on the owner's production approval) and
  42340327762 (pending, `1da9e657`); the docs site still serves the 2026-11-02 build.
- **Programming model v3** (ADR 0294, 0295, 0296): declared as the target; no member is converted yet
  (STA-344) and its checks are planned (STA-338 to STA-340), per `AGENTS.md`.
- **Secrets move to SOPS** (ADR 0525, accepted 2026-11-06): CI and workstations read sops; what is left is listed in section 6.
- **Reference apps** `apps/console`, `apps/mobile`, `apps/playground` and services `example`, `health`: no
  deploy run on record for them in this repository.

## 5. Map

| Path                          | Holds                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------- |
| `packages/<category>/<name>`  | the 119 `@stackra/*` libraries; `packages/tooling/` the 5 config presets      |
| `packages/developer/`         | `cli`, `gen`, `runway`, `repo-checks`, `flow-preset`, `renderers` and more    |
| `apps/docs`                   | Fumadocs site (ADR 0514); pages `src/docs/`, ADRs `src/docs/adr/` (521 files) |
| `apps/console`, `apps/mobile` | reference web (Vite) and Expo apps                                            |
| `apps/playground`             | design-system playground                                                      |
| `services/`                   | reference services `example`, `health`                                        |
| `workers/`                    | Cloudflare Workers: `registry`, `static`, `turbo-cache`, `edge`               |
| `tools/`                      | repository scripts, scaffold templates, schemas, consumer gate                |
| `.agents/`                    | rules, agents, hooks, skills and Flow specs (`specs/`, 331 folders)           |
| `.flow/`                      | Figentra Flow install: generated constitution, `lock.json`, `overrides/`      |
| `.github/workflows/`          | 18 workflows (CI, release, deploys, runway, testbed, observability)           |
| `.notes`                      | private submodule; never needed by CI or agents                               |

Authoritative documents, in order:

1. `AGENTS.md` (root; generated by `fflow sync` from the stackra preset and `.flow/overrides/`, which lists
   `.agents/rules/` in its Rules index). `CLAUDE.md` only includes it. Members may
   carry their own `AGENTS.md` (138 nested files; the largest is `packages/developer/gen/AGENTS.md`).
2. ADRs: `apps/docs/src/docs/adr/index.mdx`; numbers are reserved in `apps/docs/adr/numbers.yaml`.
3. Constitution: `apps/docs/src/docs/constitution/` (rendered to `.flow/constitution.md`).
4. Specs: `.agents/specs/<key>-<slug>/` (Figentra Flow).
5. Runbooks: `apps/docs/src/docs/runbooks/`; roadmap `apps/docs/src/docs/roadmap.mdx`.
6. `README.md` and `docs/repository-guide.md` (overview; both carry stale facts, see section 6).

## 6. Open risks

- **Main CI state: red.** No Quality Gate pass since 2026-10-31; the format failure on main blocks every PR.
- **Open pull requests: 23** (this one included), the oldest from 2026-11-02 (#280); one is the release PR (#619).
- **Branches: 132** besides `main`: 24 with an open PR, 20 whose PR merged, 25 whose PR closed, 63 with no
  PR; 10 have no commit since before 2026-10-31. About 108 are candidates for deletion.
- **Infisical references remaining:** `git grep -i -c infisical` counts 1281 lines in 244 files after the
  core stragglers pull request (1905 lines in 416 files at `1da9e657`); 123 files outside ADRs, CHANGELOGs and
  `.agents/specs/`. Live wiring left: `runway.yaml` `providers.infisical` and the `INFISICAL_*` CI variables
  `@stackra/infra-github` derives from it (plan phase P6); the testbed (`infra-testbed`, `apply-testbed.yml`,
  `testbed-image.yml`, design pending). The rest is prose in Flow-rendered files (`.agents/`, `.claude/`, `.flow/`,
  `AGENTS.md`, the flow preset) that resync after a Flow release, the agent hooks and settings (owner's yes), and
  the runbooks `secrets`, `setup`, `runway`, `deploys`, `token-rotation` and `test-infrastructure`.
- **Stale facts in overview docs:** `README.md` says the packages are at 0.3.0 (they are 0.18.1);
  `docs/repository-guide.md` calls the docs app "Mintlify" (Fumadocs since ADR 0514) and lists four config
  presets (there are five).
- **Agent guide size:** root `AGENTS.md` is 84 KB, about 68 KB of it rules that also exist, near-identical,
  in `.agents/rules/`, `.flow/overrides/rules/` and `packages/developer/flow-preset/preset/rules/`.
- **Pending owner action:** the docs deploys (runs 42338715844, 42340327762) wait on the owner's production approval.
