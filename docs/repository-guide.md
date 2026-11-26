<!-- Stackra file contract. Purpose: the long-form repository guide moved out of the README when it became the standard Figentra README (STA-1879): Stackra and Figentra OS, the repository map, the tiers and key rules, the commands and how work flows. Boundary: orientation only; the rules are AGENTS.md, the decisions are the ADRs. Runtime: docs. Governing contract: STA-1879. -->

# The Stackra repository guide

The detail behind the [README](../../README.md): how this monorepo is laid out, the rules every member follows, the
root commands and how a change moves from issue to merge.

## Stackra and Figentra OS

Figentra OS is Figentra's private product: a set of services built on Stackra packages and sold as SaaS, on-prem and
air-gapped. Its services live in their own repository and install published `@stackra/*` packages from the Stackra registry (`https://npm.stackra.figentra.com/`, ADR 0453)
([ADR 0025](../apps/docs/src/docs/adr/0025-packages-publish-to-private-registry.mdx),
[ADR 0075](../apps/docs/src/docs/adr/0075-stackra-ships-packages-figentra-os-ships-services.mdx)). No product code lands here,
and shared packages never contain a product name or literal. Several Stackra packages are being ported from Figentra
OS and relicensed to MIT on port ([ADR 0084](../apps/docs/src/docs/adr/0084-figentra-os-package-port-plan.mdx)).

## Repository map

| Path                                                   | Holds                                                                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| [`apps/`](../apps)                                     | `@figentra/console` (web), `@figentra/mobile` (Expo), `@figentra/docs` (Mintlify docs and the ADRs)     |
| [`packages/<category>/<name>`](../packages)            | `@stackra/<name>` libraries, one folder per category (foundation, application, communication, …)        |
| [`packages/tooling/`](../packages/tooling)             | `@stackra/{typescript,oxlint,vitest,tsdown}-config` presets every member extends                        |
| [`services/`](../services)                             | `@figentra/service-<name>` reference services (`example`, `health`), plain TypeScript                   |
| [`tools/scripts/`](../tools/scripts)                   | the repository scripts behind `pnpm validate`, `pnpm new`, `pnpm linear`, the spec gates and agent sync |
| [`tools/scaffold/`](../tools/scaffold)                 | the templates `pnpm new` renders                                                                        |
| [`.agents/`](../.agents)                               | the source of every AI artifact: rules, agents, hooks, skills and specs                                 |
| [`.claude/`](../.claude), [`.opencode/`](../.opencode) | what Claude Code and OpenCode read, mostly projected from `.agents/` by `pnpm spec:sync`                |
| [`.flow/`](../.flow)                                   | the Figentra Flow install: the generated constitution, `lock.json` and optional `overrides/`            |
| [`.agents/specs/`](../.agents/specs)                   | Figentra Flow specs, one folder per Linear issue (`sta-<n>-<slug>/`)                                    |
| [`.github/`](../.github)                               | CI (the `Quality Gate`), release and Linear sync workflows, the PR template, CODEOWNERS                 |
| [`.changeset/`](../.changeset)                         | pending changesets for package releases                                                                 |
| `.notes/`                                              | a private git submodule for the owner only; excluded from every check                                   |

Root configuration: `pnpm-workspace.yaml` (members and version catalogs), `turbo.jsonc` (tasks and tier tags),
`mise.toml` (toolchain), `lefthook.yml` (git hooks), `.commitlintrc.yaml`, `.oxlintrc.jsonc`, `.oxfmtrc.jsonc`,
`knip.jsonc`, `.gitleaks.toml`, `.mcp.yaml` (MCP servers, rendered to the gitignored `.mcp.json`) and `opencode.jsonc`.

## Tiers and the key rules

Every member declares exactly one tier tag in its `turbo.jsonc`, and dependencies flow one way
([ADR 0003](../apps/docs/src/docs/adr/0003-tier-dependency-direction.mdx)):

```text
tier:config → tier:lib → tier:app
                       → tier:service      (apps and services never import each other)
```

- **Versions** come only from the catalogs in `pnpm-workspace.yaml` (`catalog:<name>`) or `workspace:*`, pinned
  exactly; `catalogMode: strict`.
- **Tests** sit directly in a `__tests__/` folder beside their subject, `src/**/__tests__/<name>.test.ts`; no root
  `tests/`, no `.spec` ([ADR 0022](../apps/docs/src/docs/adr/0022-tests-live-in-tests-folders.mdx)).
- **Boundaries**: a package never imports an app, a service, `encore.dev` or another package's `src/`; services talk
  through versioned events or typed clients, never each other's source.
- **Imports**: a member with a `src/` tree declares `#` subpath imports (`#core`, `#application/*`) in its
  `package.json`; relative imports never climb with `../` and carry no extension
  ([ADR 0006](../apps/docs/src/docs/adr/0006-naming-exports-and-imports.mdx)). tsdown bundles every `#` import, so
  `pnpm pack` and `pnpm publish` drop the map from the packed manifest (`.pnpmfile.mjs`, ADR 0177 PK4).
- **Naming**: packages are `@stackra/<name>`, apps `@figentra/<dir>`, services `@figentra/service-<dir>`. Files are
  kebab-case, one exported declaration per file with a kind suffix (`token.class.ts`), and barrels name every symbol.
- **Config**: `tsconfig.json` extends one `@stackra/typescript-config` preset; a JSON config is `.jsonc` when its
  reader accepts comments.
- **Not built yet**: rejected and deferred technologies (ESLint, Prettier, Jest, Prisma, Express, Zustand, `.env`
  files and more) are listed in
  [ADR 0011](../apps/docs/src/docs/adr/0011-rejected-and-deferred-technologies.mdx) and refused by `pnpm validate`.

The rules in full, and what enforces each one, are in [`AGENTS.md`](../AGENTS.md).

## Commands

| Command                                      | Does                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `pnpm verify`                                | format check, lint, typecheck, test, build, then `validate`, `boundaries` and `knip`                                |
| `pnpm verify:affected`                       | the turbo half of `verify`, only for members changed since `main`                                                   |
| `pnpm validate`                              | repository shape, spec gates, hook tests and the agent sync check                                                   |
| `pnpm build` / `test` / `lint` / `typecheck` | one turbo task across every member                                                                                  |
| `pnpm format` / `pnpm format:check`          | oxfmt (and shfmt for `*.sh`) over the repo, writing or checking                                                     |
| `pnpm boundaries`                            | `turbo boundaries`: the tier direction                                                                              |
| `pnpm knip`                                  | unused files, exports and dependencies                                                                              |
| `pnpm docs` / `pnpm console` / `pnpm mobile` | run one app in dev mode                                                                                             |
| `pnpm new <kind> <name>`                     | scaffold a member from `tools/scaffold/templates`                                                                   |
| `pnpm changeset`                             | record a release note for a package change                                                                          |
| `pnpm secrets:scan`                          | gitleaks over the whole history                                                                                     |
| `pnpm doctor`                                | fresh-machine checklist                                                                                             |
| `pnpm spec:sync`                             | `fflow sync`: render the Flow skills, project `.agents/` into `.claude/` and `.opencode/`, record `.flow/lock.json` |
| `pnpm spec:gate` / `pnpm spec:trace`         | spec stage gates and requirement-to-test traceability                                                               |
| `pnpm linear <command>`                      | keep the Linear issue current: `start`, `review`, `done`, `comment`, `create`, `mine`                               |
| `pnpm delegate <task-type> "<brief>"`        | hand a task to the executor `.agents/routing.yaml` names (`--issue STA-n` required)                                 |
| `pnpm pr:merge <n>`                          | the only way an agent merges: green gate and an `AI-REVIEW: PASS` for the head's diff                               |

`pnpm linear`, `pnpm spec:linear`, `pnpm bot:*` and `pnpm pr:merge` read their tokens from sops through
`tools/scripts/secrets-exec.mjs`. One line per
script: [`tools/scripts`](../tools/scripts).

## How work flows

1. **Issue.** Every piece of work has an issue in the Linear team `STA`
   ([ADR 0065](../apps/docs/src/docs/adr/0065-linear-gate-is-checked-offline.mdx)).
2. **Lane and spec.** The change picks a lane: bug, chore, lite or full
   ([ADR 0120](../apps/docs/src/docs/adr/0120-sdlc-spec-location-lanes-and-change-risk.mdx)). Lite and full work starts as a
   Figentra Flow spec in `.agents/specs/sta-<n>-<slug>/` (`/flow-specify` → clarify → plan → tasks → implement); the
   plan step refuses until the spec gate passes ([ADR 0510](../apps/docs/src/docs/adr/0510-flow-replaces-spec-kit.mdx)).
3. **Branch.** The branch is Linear's name, `figentra/sta-<n>-<slug>`; `pnpm linear start STA-n` moves the issue to
   In Progress. Commits are conventional, and `feat`, `fix`, `refactor` and `perf` commits carry `Refs: STA-n`.
4. **Pull request.** `pnpm verify` is green, the PR follows the template, and `pnpm linear review STA-n <url>` moves
   the issue to In Review. CI's `Quality Gate` is the only required check.
5. **Independent review.** A separate AI reviewer, never the author, posts an advisory
   `Review (advisory): PASS <head sha> base=<base ref>` through `pnpm bot:gh`. The `stackra-reviewer` app is retired
   ([ADR 0523](../apps/docs/src/docs/adr/0523-humans-approve-policy-not-instances.mdx) decision 6); `AI-REVIEW:`
   verdicts come from Figentra Flow in CI once it posts them. Design PRs and change-risk R3 also need the owner's
   approval.
6. **Merge.** `pnpm pr:merge` enqueues the PR in the merge queue, which squash-merges after the gate passes on the group
   ([ADR 0119](../apps/docs/src/docs/adr/0119-merge-policy-and-release-authority.mdx)); the issue moves to Done. Packages
   release through changesets in CI.

## Documentation and decisions

The guides, standards, runbooks and the architecture decision records live in [`apps/docs/src/docs`](../apps/docs/src/docs), a
Mintlify site; run it locally with `pnpm docs`. Start with the [introduction](../apps/docs/src/docs/index.mdx), the
[repository structure](../apps/docs/src/docs/guides/structure.mdx), the [constitution](../apps/docs/src/docs/constitution/index.mdx)
and the [ADR index](../apps/docs/src/docs/adr/index.mdx). Agent setup is under [agents](../apps/docs/src/docs/agents/index.mdx).

## Contributing

Read [`AGENTS.md`](../AGENTS.md) first: it holds every rule, for people and agents alike. Then follow
[how work flows](#how-work-flows) and the [definition of done](../apps/docs/src/docs/guides/definition-of-done.mdx). A change
is done when `pnpm verify` is green and its Linear issue is in the right state.
