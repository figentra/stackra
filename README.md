<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="packages/experience/brand/assets/public/logos/stackra-endorsed-en-dark.svg" />
    <img src="packages/experience/brand/assets/public/logos/stackra-endorsed-en-light.svg" alt="stackra, by figentra" height="48" />
  </picture>
</p>

<p align="center">Packages that implement Figentra's contracts.</p>

Stackra is a TypeScript framework, shipped as the `@stackra/*` packages, plus the reference apps and services that
prove them. This repository is its monorepo, on pnpm and Turborepo.

## What Stackra is

- **A framework tier, not a product** ([ADR 0023](apps/docs/src/adr/0023-stackra-is-a-framework.mdx)). Stackra ships
  packages only. The apps and services here are small reference members and test beds; they never carry a product
  feature ([ADR 0075](apps/docs/src/adr/0075-stackra-ships-packages-figentra-os-ships-services.mdx)).
- **Decorators-only authoring** ([ADR 0094](apps/docs/src/adr/0094-decorators-only-authoring.mdx)). You describe
  modules, actions, endpoints and fields with decorators on plain TypeScript classes, with explicit DI tokens
  (`@stackra/container`, Nest-shaped but with no `@nestjs/*` and no `reflect-metadata`;
  [ADR 0005](apps/docs/src/adr/0005-di-container-and-legacy-decorators.mdx)). Input and output are Zod schemas
  ([ADR 0095](apps/docs/src/adr/0095-zod-inside-field-decorators.mdx)).
- **Actions are the unit** ([ADR 0098](apps/docs/src/adr/0098-actions-are-the-unit.mdx)). Behaviour is a decorated
  action with a key, typed input and output and a permission. The action pipeline supplies the typed caller,
  authorisation and idempotency. An action becomes an HTTP endpoint with `@AsEndpoint`.
- **Encore is generated, never hand-written**
  ([ADR 0091](apps/docs/src/adr/0091-generated-encore-app-in-stackra-folder.mdx),
  [ADR 0124](apps/docs/src/adr/0124-encore-is-the-generated-runtime-target.mdx)). Service source stays plain
  TypeScript; `stackra gen` emits the Encore.ts application into the gitignored `.stackra/encore/`. No package or
  service imports `encore.dev`.
- **AI-native** ([ADR 0021](apps/docs/src/adr/0021-ai-engine-and-agent-write-safety.mdx),
  [ADR 0100](apps/docs/src/adr/0100-ai-model-and-ownership.mdx)). The planned `@stackra/ai` package builds on AI SDK
  core and the MCP SDK. Every tool call is an action, under the same authorisation as a human caller, and a write
  tool needs a named human approver. The repository is also built with AI agents, under the rules in
  [`AGENTS.md`](AGENTS.md).

## Stackra and Figentra OS

Figentra OS is Figentra's private product: a set of services built on Stackra packages and sold as SaaS, on-prem and
air-gapped. Its services live in their own repository and install published `@stackra/*` packages from the private
registry `npm.figentra.com`
([ADR 0025](apps/docs/src/adr/0025-packages-publish-to-private-registry.mdx),
[ADR 0075](apps/docs/src/adr/0075-stackra-ships-packages-figentra-os-ships-services.mdx)). No product code lands here,
and shared packages never contain a product name or literal. Several Stackra packages are being ported from Figentra
OS and relicensed to MIT on port ([ADR 0084](apps/docs/src/adr/0084-figentra-os-package-port-plan.mdx)).

## Status

**Pre-release.** Nothing is published or deployed yet. Foundation work is in progress: the SDLC, the repository
gates, the tooling presets and the brand package are in place; the foundation kernel packages (contracts, support,
container, config, logger, validation, events) are drafted as specs in [`.agents/specs`](.agents/specs) and not yet
built.
Apps and services are minimal entries. The ordered plan is the
[roadmap](apps/docs/src/roadmap.mdx).

## Quickstart

```bash
mise install    # Node, pnpm, gitleaks, the Infisical CLI, uv, Maestro and spec-kit, pinned in mise.toml
pnpm install    # also installs the lefthook git hooks
pnpm verify     # the full gate: what "done" means
pnpm docs       # the documentation site on http://localhost:3333
pnpm new <kind> <name>   # scaffold a member: service, package, tooling, app:console, app:mobile, app:desktop, app:docs
```

Contributors with access to the Infisical vault also run `infisical login` (the workspace is the committed
`.infisical.yaml`). The vault feeds `pnpm linear`, the bot commands and the MCP servers; secret values never live in
a file ([ADR 0009](apps/docs/src/adr/0009-secrets-two-mechanisms.mdx)). `pnpm doctor` checks a fresh machine and
says what is missing. Full steps: [quickstart](apps/docs/src/quickstart.mdx) and
[fresh machine](apps/docs/src/runbooks/fresh-machine.mdx).

## Repository map

| Path                                             | Holds                                                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| [`apps/`](apps)                                  | `@figentra/console` (web), `@figentra/mobile` (Expo), `@figentra/docs` (Mintlify docs and the ADRs)     |
| [`packages/<category>/<name>`](packages)         | `@stackra/<name>` libraries, one folder per category (foundation, application, communication, …)        |
| [`packages/tooling/`](packages/tooling)          | `@stackra/{typescript,oxlint,vitest,tsdown}-config` presets every member extends                        |
| [`services/`](services)                          | `@figentra/service-<name>` reference services (`example`, `health`), plain TypeScript                   |
| [`tools/scripts/`](tools/scripts)                | the repository scripts behind `pnpm validate`, `pnpm new`, `pnpm linear`, the spec gates and agent sync |
| [`tools/scaffold/`](tools/scaffold)              | the templates `pnpm new` renders                                                                        |
| [`.agents/`](.agents)                            | the source of every AI artifact: rules, agents, hooks, skills, specs and the spec-kit preset            |
| [`.claude/`](.claude), [`.opencode/`](.opencode) | what Claude Code and OpenCode read, mostly projected from `.agents/` by `pnpm agents:sync`              |
| [`.specify/`](.specify)                          | the spec-kit install: templates, scripts, the installed Stackra preset and the generated constitution   |
| [`.agents/specs/`](.agents/specs)                | spec-kit specs, one folder per Linear issue (`sta-<n>-<slug>/`)                                         |
| [`.github/`](.github)                            | CI (the `Quality Gate`), release and Linear sync workflows, the PR template, CODEOWNERS                 |
| [`.changeset/`](.changeset)                      | pending changesets for package releases                                                                 |
| `.notes/`                                        | a private git submodule for the owner only; excluded from every check                                   |

Root configuration: `pnpm-workspace.yaml` (members and version catalogs), `turbo.jsonc` (tasks and tier tags),
`mise.toml` (toolchain), `lefthook.yml` (git hooks), `commitlint.config.mjs`, `.oxlintrc.jsonc`, `.oxfmtrc.jsonc`,
`knip.jsonc`, `.gitleaks.toml`, `.mcp.yaml` (MCP servers, rendered to `.mcp.json`) and `opencode.jsonc`.

## Tiers and the key rules

Every member declares exactly one tier tag in its `turbo.jsonc`, and dependencies flow one way
([ADR 0003](apps/docs/src/adr/0003-tier-dependency-direction.mdx)):

```text
tier:config → tier:lib → tier:app
                       → tier:service      (apps and services never import each other)
```

- **Versions** come only from the catalogs in `pnpm-workspace.yaml` (`catalog:<name>`) or `workspace:*`, pinned
  exactly; `catalogMode: strict`.
- **Tests** sit directly in a `__tests__/` folder beside their subject, `src/**/__tests__/<name>.test.ts`; no root
  `tests/`, no `.spec` ([ADR 0022](apps/docs/src/adr/0022-tests-live-in-tests-folders.mdx)).
- **Boundaries**: a package never imports an app, a service, `encore.dev` or another package's `src/`; services talk
  through versioned events or typed clients, never each other's source.
- **Imports**: a member with a `src/` tree declares `#` subpath imports (`#core`, `#application/*`) in its
  `package.json`; relative imports never climb with `../` and carry no extension
  ([ADR 0006](apps/docs/src/adr/0006-naming-exports-and-imports.mdx)).
- **Naming**: packages are `@stackra/<name>`, apps `@figentra/<dir>`, services `@figentra/service-<dir>`. Files are
  kebab-case, one exported declaration per file with a kind suffix (`token.class.ts`), and barrels name every symbol.
- **Config**: `tsconfig.json` extends one `@stackra/typescript-config` preset; a JSON config is `.jsonc` when its
  reader accepts comments.
- **Not built yet**: rejected and deferred technologies (ESLint, Prettier, Jest, Prisma, Express, Zustand, `.env`
  files and more) are listed in
  [ADR 0011](apps/docs/src/adr/0011-rejected-and-deferred-technologies.mdx) and refused by `pnpm validate`.

The rules in full, and what enforces each one, are in [`AGENTS.md`](AGENTS.md).

## Commands

| Command                                      | Does                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm verify`                                | format check, lint, typecheck, test, build, then `validate`, `boundaries` and `knip`  |
| `pnpm verify:affected`                       | the turbo half of `verify`, only for members changed since `main`                     |
| `pnpm validate`                              | repository shape, spec gates, hook tests and the agent sync check                     |
| `pnpm build` / `test` / `lint` / `typecheck` | one turbo task across every member                                                    |
| `pnpm format` / `pnpm format:check`          | oxfmt, writing or checking                                                            |
| `pnpm boundaries`                            | `turbo boundaries`: the tier direction                                                |
| `pnpm knip`                                  | unused files, exports and dependencies                                                |
| `pnpm docs` / `pnpm console` / `pnpm mobile` | run one app in dev mode                                                               |
| `pnpm new <kind> <name>`                     | scaffold a member from `tools/scaffold/templates`                                     |
| `pnpm changeset`                             | record a release note for a package change                                            |
| `pnpm secrets:scan`                          | gitleaks over the whole history                                                       |
| `pnpm doctor`                                | fresh-machine checklist                                                               |
| `pnpm agents:sync` / `pnpm agents:check`     | project `.agents/` into `.claude/` and `.opencode/`, or check for drift               |
| `pnpm speckit:sync`                          | install the Stackra spec-kit preset into `.specify/`                                  |
| `pnpm spec:gate` / `pnpm spec:trace`         | spec stage gates and requirement-to-test traceability                                 |
| `pnpm linear <command>`                      | keep the Linear issue current: `start`, `review`, `done`, `comment`, `create`, `mine` |
| `pnpm delegate <task-type> "<brief>"`        | hand a task to the executor `.agents/routing.yaml` names (`--issue STA-n` required)   |
| `pnpm pr:merge <n>`                          | the only way an agent merges: green gate and an `AI-REVIEW: PASS` for the head commit |

`pnpm linear`, `pnpm spec:linear`, `pnpm bot:*` and `pnpm pr:merge` read their tokens from Infisical. One line per
script: [`tools/scripts`](tools/scripts).

## How work flows

1. **Issue.** Every piece of work has an issue in the Linear team `STA`
   ([ADR 0065](apps/docs/src/adr/0065-linear-gate-is-checked-offline.mdx)).
2. **Lane and spec.** The change picks a lane: bug, chore, lite or full
   ([ADR 0120](apps/docs/src/adr/0120-sdlc-spec-location-lanes-and-change-risk.mdx)). Lite and full work starts as a
   spec-kit spec in `.agents/specs/sta-<n>-<slug>/` (`/speckit.specify` → clarify → plan → tasks → implement); the
   plan step refuses until the spec gate passes ([ADR 0067](apps/docs/src/adr/0067-spec-kit-is-the-sdlc.mdx)).
3. **Branch.** The branch is Linear's name, `figentra/sta-<n>-<slug>`; `pnpm linear start STA-n` moves the issue to
   In Progress. Commits are conventional, and `feat`, `fix`, `refactor` and `perf` commits carry `Refs: STA-n`.
4. **Pull request.** `pnpm verify` is green, the PR follows the template, and `pnpm linear review STA-n <url>` moves
   the issue to In Review. CI's `Quality Gate` is the only required check.
5. **Independent review.** A separate AI reviewer, never the author, posts `AI-REVIEW: PASS <head sha>` as the
   `stackra-reviewer` app through `pnpm bot:review`
   ([ADR 0230](apps/docs/src/adr/0230-reviewer-identity-separate-from-builder.mdx)). Design PRs
   and change-risk R3 also need the owner's approval.
6. **Merge.** Squash merge through `pnpm pr:merge`
   ([ADR 0119](apps/docs/src/adr/0119-merge-policy-and-release-authority.mdx)); the issue moves to Done. Packages
   release through changesets in CI.

## Documentation and decisions

The guides, standards, runbooks and the architecture decision records live in [`apps/docs/src`](apps/docs/src), a
Mintlify site; run it locally with `pnpm docs`. Start with the [introduction](apps/docs/src/index.mdx), the
[repository structure](apps/docs/src/guides/structure.mdx), the [constitution](apps/docs/src/constitution/index.mdx)
and the [ADR index](apps/docs/src/adr/index.mdx). Agent setup is under [agents](apps/docs/src/agents/index.mdx).

## Contributing

Read [`AGENTS.md`](AGENTS.md) first: it holds every rule, for people and agents alike. Then follow
[how work flows](#how-work-flows) and the [definition of done](apps/docs/src/guides/definition-of-done.mdx). A change
is done when `pnpm verify` is green and its Linear issue is in the right state.

## Security

There is no `SECURITY.md` yet. Report a vulnerability privately to the maintainer
([@figentra-usr](https://github.com/figentra-usr)), never in a public issue, pull request or spec. The rules for
secrets and security are in the [secrets](apps/docs/src/constitution/secrets.mdx) and
[security](apps/docs/src/constitution/security.mdx) laws; `gitleaks` scans every commit.

## Licence

The code is MIT ([`LICENSE`](LICENSE)). The Stackra logos, marks and brand images are not, and the fonts keep their
SIL Open Font License: see [`NOTICE`](NOTICE) and
[ADR 0024](apps/docs/src/adr/0024-mit-license-with-exclusions.mdx).
