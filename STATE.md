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

- Default branch `main`, head `cb2673768f2a658e52135bf520fbf0891288aea5` (2026-11-07,
  "refactor(config): remove the infisical secret store driver (#620)").
- Packages: 119 `@stackra/*` members under `packages/<category>/<name>` in 14 categories; 118 public at
  **0.18.1**, 1 private (`@stackra/showcase`, 0.0.0). Apps, services and workers are private at 0.0.1.
- Root `package.json` is private 0.0.0. Versions come only from the `pnpm-workspace.yaml` catalogs
  (`catalogMode: strict`).
- Toolchain (`mise.toml`, `package.json`, catalogs): Node 24.22.0, pnpm 12.16.1, Turborepo 2.11.9,
  TypeScript 6.0.3 / 7.0.2, tsdown 0.23.1, vitest 5.0.5, oxlint 1.86.0, oxfmt 0.71.0, lefthook 2.2.1,
  changesets 3.0.3, wrangler 4.148.0, gitleaks 8.30.1, sops 3.10.2, age 1.2.1, Infisical CLI 0.44.2 (still
  pinned), Figentra Flow `@figentra-oss/flow` 0.6.5 (`fflow`, stackra preset).

## 3. Proven by a real run

- **Release to the Stackra registry.** GitHub releases `@stackra/*@0.18.1` created 2026-11-07 04:15Z from
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

- **The Quality Gate (`ci.yml`).** It runs on pull requests only. Its last success is run 41179552309
  (2026-10-31, `d70b2843`); every run since, on every branch, fails. Latest cause (run 42339257875):
  `pnpm format:check` finds 4 unformatted files on main (`.vscode/tasks.json` and three files under
  `packages/developer/runway/src/node/`), so no pull request can pass.
- **Tests.** Under the merge-now rule (STA-2083) GitHub CI runs no tests and nothing tests on a workstation;
  tests run later on the testbed. No test result is recorded in this repository, so no package's tests are
  proven at this head.
- **Runway workflows never ran:** `runway-cloudflare-workers.yml`, `runway-npm.yml`, `runway-smoke.yml`,
  `runway-store.yml`, `fflow-approve.yml` have no runs. `runway-drift.yml` has never passed (last: run
  42205544196, failed at "Read-only Cloudflare token (Infisical OIDC)").
- **Observability.** `apply-observability.yml` has never passed (run 42336073171 failed at "Pulumi up").
- **Testbed image and fallback.** `testbed-image.yml` has never passed on main (it passed on a PR branch, run
  42330185147); `testbed-fallback.yml` has never passed.
- **Workers without a deploy workflow run here:** `workers/edge` and `workers/env-sync`; the
  `env-sync.stackra.figentra.com` host does not resolve.
- **Docs deploy at head.** `deploy-docs.yml` run 42338715844 is waiting on the owner's production approval;
  the docs site still serves the 2026-11-02 build.
- **Programming model v3** (ADR 0294, 0295, 0296): declared as the target; no member is converted yet
  (STA-344) and its checks are planned (STA-338 to STA-340), per `AGENTS.md`.
- **Secrets move to SOPS** (ADR 0525, accepted 2026-11-06): declared; Infisical is still wired (section 6).
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
| `workers/`                    | Cloudflare Workers: `registry`, `static`, `turbo-cache`, `edge`, `env-sync`   |
| `tools/`                      | repository scripts, scaffold templates, schemas, consumer gate                |
| `.agents/`                    | rules, agents, hooks, skills and Flow specs (`specs/`, 332 folders)           |
| `.flow/`                      | Figentra Flow install: generated constitution, `lock.json`, `overrides/`      |
| `.github/workflows/`          | 18 workflows (CI, release, deploys, runway, testbed, observability)           |
| `.notes`                      | private submodule; never needed by CI or agents                               |

Authoritative documents, in order:

1. `AGENTS.md` (root; generated by `fflow sync` from the stackra preset and `.flow/overrides/`, plus
   `.agents/rules/` projected by `tools/scripts/agents-sync.mjs`). `CLAUDE.md` only includes it. Members may
   carry their own `AGENTS.md` (138 nested files; the largest is `packages/developer/gen/AGENTS.md`).
2. ADRs: `apps/docs/src/docs/adr/index.mdx`; numbers are reserved in `apps/docs/adr/numbers.yaml`.
3. Constitution: `apps/docs/src/docs/constitution/` (rendered to `.flow/constitution.md`).
4. Specs: `.agents/specs/<key>-<slug>/` (Figentra Flow).
5. Runbooks: `apps/docs/src/docs/runbooks/`; roadmap `apps/docs/src/docs/roadmap.mdx`.
6. `README.md` and `docs/repository-guide.md` (overview; both carry stale facts, see section 6).

## 6. Open risks

- **Main CI state: red.** No Quality Gate pass since 2026-10-31; the format failure on main blocks every PR.
- **Open pull requests: 22**, the oldest from 2026-11-02 (#280); one is the release PR (#619).
- **Branches: 130** besides `main`: 22 with an open PR, 20 whose PR merged, 26 whose PR closed, 63 with no
  PR; 10 have no commit since before 2026-10-31. About 109 are candidates for deletion.
- **Infisical references remaining:** `git grep -i -c infisical` counts 1893 lines in 416 files, though
  ADR 0525 replaces Infisical. Live wiring, not only prose: `.infisical.yaml`; `flow.config.json`
  (`secrets.kind: infisical`); `mise.toml` (Infisical CLI pin); `runway.yaml` (`providers.infisical`); the
  `package.json` scripts `linear`, `spec:linear`, `bot:token`, `bot:gh`, `bot:git`, `pr:merge`, `adr:reserve`
  (all `infisical run`); `.agents/rules/secrets.md` still describes Infisical as the dev/CI vault;
  `runway-drift.yml` and `apply-testbed.yml` read Infisical.
- **Stale facts in overview docs:** `README.md` says the packages are at 0.3.0 (they are 0.18.1);
  `docs/repository-guide.md` calls the docs app "Mintlify" (Fumadocs since ADR 0514) and lists four config
  presets (there are five).
- **Retired names still live:** `.github/CODEOWNERS` names `/figentra-flow.config.json` (the file is now
  `flow.config.json`); the shipped Flow preset template
  `packages/developer/flow-preset/preset/templates/spec-template.md` uses `packages/figentra-flow` paths.
- **Agent guide size:** root `AGENTS.md` is 84 KB, about 68 KB of it rules that also exist, near-identical,
  in `.agents/rules/`, `.flow/overrides/rules/` and `packages/developer/flow-preset/preset/rules/`.
- **Pending owner action:** the docs deploy (run 42338715844) waits on the owner's production approval.
