# Feature Specification: `create-stackra`, the npm initializer, and one documented install line

**Feature Branch**: `figentra/sta-2897-create-stackra`

**Created**: 2026-11-27

**Status**: Implementing

**Tier**: big

**Approver**: leader (technical stops at Clarified and Planned under the owner's delegation; change risk R2); the npmjs name claim and the npmjs publish are the owner's

**Linear**: STA-2897

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: the readiness audit of 2026-11-26, item 22.3 (blocker): `npm create stackra` and `npx @stackra/cli` both
answer 404 on npmjs, no page documents the scope-mapped one-liner, and ADR 0199 promises a `create-stackra-app` that
does not exist. A developer on a clean machine must get a working app from one documented command, with no
hand-written `.npmrc`. The review of 2026-11-27 moved the spec to `big` (a new package), kept the npm initializer's
name out of the customer docs until the owner holds it on npmjs, and pointed the npmjs member at `stackra-inc/stackra`.

## Impact

- **Apps touched**: apps/docs (ADR 0199 amendment, the ADR index row, `customers/install.mdx`, the architecture map)
- **Services touched**: none
- **Packages touched**: packages/developer/create-stackra (new), packages/developer/cli (`stackra create` writes the registry it used into the app's `.npmrc`), packages/developer/repo-checks (`UNSCOPED_PACKAGES`, `expectedName`, `NPMJS_REPOSITORY` in `npmMetadataFor` and the member file check)
- **Public contract change**: additive: a new member and npm name `create-stackra` (bin `create-stackra`, no code export, `"private": true` until the owner's npm name claim); `@stackra/repo-checks` exports `UNSCOPED_PACKAGES`, and `npmMetadataFor(dir)` answers the `stackra-inc/stackra` URLs for a folder of `UNSCOPED_PACKAGES`; `stackra create` maps `@stackra` (and every scope the starter maps to the default host) to the registry it fetched from. Nothing existing changes its signature; with the default registry the written `.npmrc` is unchanged, and every other member's metadata is unchanged.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: no shell (children start with `shell: false`; on Windows npm's `npx-cli.js` runs under the same Node instead of `npx.cmd`); `--cli` takes a version or dist-tag only, never a path, URL or another package; only the `@stackra` scope is mapped, so no third-party name can be served from the Stackra registry (it never proxies npmjs, ADR 0453 decision 4); no file and no npm setting is written. Supply chain: no customer page names the initializer by its npm name until the owner holds `create-stackra` on npmjs, so nobody else can publish code under a name the docs tell readers to run
- **Secrets**: none (`STACKRA_LICENCE_TOKEN` passes through the environment untouched, as it would for `stackra create`)
- **External blocker**: the owner claims the npmjs name `create-stackra` (a placeholder `0.0.0` from the Stackra account is enough) before any page names `npm create stackra`; publishing the real package to npmjs waits on the owner's ruling on the ADR 0453 exception. Neither blocks this change, which documents only the `npx` line
- **ADR needed**: no new ADR: ADR 0199 is amended (2026-11-27) to the real name, the documented line and the publishing condition
- **New dependencies**: none at runtime; dev dependencies of the new member come from the catalogs
- **Deploy modes**: same in all three; `--registry` / `STACKRA_REGISTRY` point an air-gapped or on-prem machine at its own Stackra registry mirror
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none (terminal only)
- **Docs to update**: apps/docs/src/docs/adr/0199-developer-experience-create-stackra-app-upgrades-stackra-dev-and-docs.mdx, apps/docs/src/docs/adr/index.mdx, apps/docs/src/docs/customers/install.mdx, packages/developer/create-stackra/README.md, packages/developer/create-stackra/AGENTS.md
- **Lane**: full
- **Change risk**: R2 (a new public package name and a developer entry point; no auth, data or secrets)

## Discovery

- **Current behaviour**: `stackra create` exists in `@stackra/cli` (SRC-001) but is reachable only through
  `npx --@stackra:registry=… @stackra/cli create`, which no page on `origin/main` documents. `registry.npmjs.org`
  answers 404 for `create-stackra` and `@stackra/cli`; the Stackra registry answers 404 for any unscoped name such as
  `vite` (SRC-002, SRC-003). `stackra create` writes `@stackra:registry=<default host>` into the app's `.npmrc`
  whatever registry it fetched the starter from, and keeps a starter's own line (SRC-001). On a clean `HOME` on
  2026-11-27 the documented line stops before an app exists: `@stackra/cli@0.33.1` (`latest`) does not install
  (`@stackra/csp@0.33.1` is not published), `@stackra/starter` answers 404, and with `@stackra/cli@0.33.0` and a
  template checkout `stackra gen` fails in the starter's example service (SRC-007).
- **Topology**: `registryOrigin` and `REGISTRY_ORIGIN_DEFAULT` in `packages/developer/cli/src/node/`; `starterFiles`
  writes the app's files; `expectedName` in `@stackra/repo-checks` requires `@stackra/<folder>` for every package
  member; `npmMetadataFor` and `checkMemberFiles` require `figentra/stackra` URLs for every member; the release
  workflow publishes every non-private member to the Stackra registry (SRC-004).
- **Dependencies**: npm's `npx` (shipped with Node.js) and its `--@scope:registry` config flag.
- **Ownership**: `@stackra/cli` and `@stackra/repo-checks` (developer category, core maintainers); ADR 0199 and ADR
  0453 (architecture); the npm name and an npmjs publish (the owner).
- **Constraints already decided**: ADR 0453 (one registry host, scoped names only, no upstream proxy, publishing only
  to the Stackra registry, npmjs only as an optional mirror of `@stackra/*`); ADR 0199 decision 1 (one command to
  start); ADR 0083 (`@stackra/cli` is the `stackra` binary).

### Sources

- **SRC-001**: `packages/developer/cli/src/node/commands/create.command.ts`, `src/node/create/functions/starter-files.function.ts` and `src/node/functions/registry-origin.function.ts` on `origin/main` (FR-005, FR-006)
- **SRC-002**: `https://registry.npmjs.org/create-stackra` and `https://registry.npmjs.org/@stackra%2fcli`, both 404 on 2026-11-27 (FR-001)
- **SRC-003**: ADR 0453 decisions 4, 6, 10 and 16 in `apps/docs/src/docs/adr/` (FR-002, FR-003, FR-008)
- **SRC-004**: `packages/developer/repo-checks/src/node/functions/expected-name.function.ts`, `check-member-files.function.ts`, `npm-metadata-for.function.ts` and `.github/workflows/runway-npm.yml` on `origin/main` (FR-007, FR-008, FR-010)
- **SRC-005**: ADR 0199 decision 1 and the readiness audit item 22.3 (2026-11-26) (FR-001, FR-004, FR-009)
- **SRC-006**: the move of the Stackra repositories to the `stackra-inc` GitHub organisation (2026-11-26) and npm's provenance rule that `repository.url` names the repository whose workflow signed the publish (the comment in `check-member-files.function.ts`) (FR-010)
- **SRC-007**: the box 2 runs in `stackra-demo` with an empty `HOME` (2026-11-27): `npx -y --@stackra:registry=https://npm.stackra.figentra.com/ @stackra/cli create` answers `ETARGET` for `@stackra/csp@0.33.1`; `@stackra/cli@0.33.0 create --starter <stackra-template checkout> --yes` writes the app and its `.npmrc`, installs, and stops at `stackra gen` (`encore.dev` undeclared in `services/example`) (FR-009)
- **SRC-008**: the review of 2026-11-27 on the pull request (the supply-chain finding on the initializer's name) (FR-009)

## Glossary

- **Initializer**: the npm package `create-<x>` that `npm create <x>` (and `pnpm create`, `yarn create`) runs.
- **Scope mapping**: the npm setting `@stackra:registry=<origin>`, which sends only `@stackra/*` names to that origin.
- **Origin**: the Stackra registry URL, ending in `/`.

## User Scenarios & Testing

### User Story 1 - One command on a clean machine (Priority: P1)

A developer with only Node.js 24 and pnpm runs the one documented line and gets `stackra create`'s questions, then a
working app, without writing an `.npmrc` or changing an npm setting. Once the owner holds the npmjs name and the
initializer is published, the same run is `npm create stackra@latest my-app`.

**Why this priority**: it is the audit's blocker; nobody outside can start an app today.

**Independent Test**: `run-create-stackra.function.test.ts` (the npx call with the scope flag) and the box 2 proof in
`stackra-demo` with an empty `HOME`, against the real registry.

**Acceptance Scenarios**:

1. **Given** a machine with no `.npmrc`, **When** `create-stackra my-app --yes` runs, **Then** npx installs
   `@stackra/cli` from the Stackra registry and every other package from npmjs, and `stackra create my-app --yes`
   runs.
2. **Given** the same machine, **When** `create-stackra -- --help` runs, **Then** `stackra create`'s help prints.

### User Story 2 - Another Stackra registry (Priority: P2)

A team behind a mirror, or a test against a local registry, sets `--registry` or `STACKRA_REGISTRY`; the CLI, the
starter and the new app's installs all come from it.

**Why this priority**: on-prem and air-gapped installs, and the release consumer gate, need it.

**Independent Test**: `run-create-stackra.function.test.ts`, `create.test.ts` and `create.command.test.ts`.

**Acceptance Scenarios**:

1. **Given** `--registry http://localhost:8787`, **When** the run starts, **Then** npx gets
   `--@stackra:registry=http://localhost:8787/` and the child `STACKRA_REGISTRY=http://localhost:8787/`.
2. **Given** `STACKRA_REGISTRY` set, **When** `stackra create` writes the app, **Then** its `.npmrc` maps `@stackra`,
   and every scope the starter mapped to the default host, to that registry.

### Edge Cases

- **EC-01**: Node.js older than 24: refused with exit 1 before anything starts.
- **EC-02**: npm keeps options before its own `--` (`npm create stackra x --registry y` sets npm's registry for
  fetching the initializer); the package README shows the options after `--`.
- **EC-03**: Windows without npm's `npx-cli.js` beside `node.exe`: nothing starts (no shell for `npx.cmd`); exit 127
  and the line to run by hand.
- **EC-04**: `@stackra/cli@latest` cannot install (a dependency not published at that version, as on 2026-11-27):
  npx's error and exit code come through; `--cli <version>` picks another.

## Requirements

### Functional Requirements

- **FR-001** (example-only): THE member `packages/developer/create-stackra` SHALL be named `create-stackra` and ship one binary, `create-stackra`, with no runtime dependency and no code export. Sources: SRC-002, SRC-005
- **FR-002**: WHEN `create-stackra <arguments>` runs THE binary SHALL start `npx --yes --@stackra:registry=<origin> @stackra/cli@<cli> create <arguments>` without a shell, with `STACKRA_REGISTRY=<origin>` added to the inherited environment, and exit with the child's code. Sources: SRC-001, SRC-003
- **FR-003**: THE origin SHALL be `--registry`, else `STACKRA_REGISTRY`, else `https://npm.stackra.figentra.com/`, ending in `/`; IF it is not an http or https URL THEN THE binary SHALL exit 2 and start nothing. Sources: SRC-001, SRC-003
- **FR-004**: THE binary SHALL take `--registry`, `--cli` and `-h`/`--help` only before `--`, forward every other argument in order and everything after `--` as written, refuse an option without its value and a `--cli` that is not a version or dist-tag (exit 2), print its help for `-h` (exit 0), and refuse a Node.js older than 24 (exit 1). Sources: SRC-005
- **FR-005**: IF npx cannot start, or no npx can be started without a shell, THEN THE binary SHALL exit 127 and print the same run as one `npx` line, each argument quoted for a POSIX shell. Sources: SRC-005
- **FR-006**: WHEN `stackra create` writes an app THE `.npmrc` SHALL map `@stackra` to the registry it fetched the starter from (`registryOrigin`), and every scope line the starter maps to the default host SHALL move to that registry; with the default registry the file SHALL be as before. Sources: SRC-001
- **FR-007**: THE repository checks SHALL accept the unscoped name `create-stackra` for `packages/developer/create-stackra` only (`UNSCOPED_PACKAGES`), and every other package folder SHALL keep `@stackra/<folder>`. Sources: SRC-004
- **FR-008** (example-only): THE member SHALL stay `"private": true` until the owner claims the npm name and rules on its npmjs publish, so the release workflow never sends an unscoped name to the Stackra registry. Sources: SRC-003, SRC-004
- **FR-009** (example-only): THE customer docs SHALL give one install line, `npx -y --@stackra:registry=https://npm.stackra.figentra.com/ @stackra/cli create <folder>`, SHALL list each item that line still needs (an installable `@stackra/cli@latest`, `@stackra/starter` on the registry, the starter passing `stackra gen`, `npm create stackra`) as pending, and SHALL NOT tell a reader to run `npm create stackra` until the owner holds the npmjs name; ADR 0199 SHALL name `create-stackra`. Sources: SRC-005, SRC-007, SRC-008
- **FR-010**: THE repository checks SHALL require a member of `UNSCOPED_PACKAGES` to carry the `repository`, `homepage` and `bugs` URLs of `stackra-inc/stackra` (`NPMJS_REPOSITORY`), and every other member SHALL keep the URLs of `MEMBER_METADATA`. Sources: SRC-004, SRC-006

### Non-functional Requirements

- **NFR-001**: THE built binary SHALL import only Node's own modules (`node:*`). Sources: SRC-002
- **NFR-002**: THE binary SHALL write no file and change no npm setting outside the app `stackra create` makes. Sources: SRC-003

### Key Entities

- **Run**: origin, CLI version or tag, forwarded arguments; turned into one npx command line.

## Acceptance criteria

- **AC-001**: WHEN `create-stackra my-app --yes` runs THE npx call SHALL be `--yes --@stackra:registry=https://npm.stackra.figentra.com/ @stackra/cli@latest create my-app --yes` with `STACKRA_REGISTRY` set to the same origin.
- **AC-002**: WHEN `--registry` or `STACKRA_REGISTRY` names another origin THE npx flag and `STACKRA_REGISTRY` SHALL both name it, the flag winning over the variable.
- **AC-003**: IF the origin is not http(s), an option lacks its value, or `--cli` is not a version or dist-tag THEN THE run SHALL exit 2 and start nothing.
- **AC-004**: THE run SHALL exit with the child's exit code (a signal as 128 plus its number), 0 for help, 1 for an old Node and 127 when npx cannot start.
- **AC-005**: WHEN `stackra create` runs with `STACKRA_REGISTRY` set THE new app's `.npmrc` SHALL map `@stackra` to it.
- **AC-006**: THE repository checks SHALL accept `create-stackra` at `packages/developer/create-stackra` and keep requiring `@stackra/<name>` elsewhere.
- **AC-007**: THE built `dist/create-stackra.mjs` SHALL import only `node:*` modules.
- **AC-008**: WHEN the repository checks read `packages/developer/create-stackra/package.json` THE checks SHALL accept the `stackra-inc/stackra` repository, homepage and bugs URLs and report a `figentra/stackra` repository URL, while every other member keeps the `MEMBER_METADATA` URLs.
- **AC-009**: WHEN a reader opens `customers/install.mdx` THE page SHALL give the scope-mapped `npx` line as its one install line and list `npm create stackra`, `@stackra/starter`, an installable `@stackra/cli@latest` and the starter's `stackra gen` as pending rows.

## Success Criteria

- **SC-001**: on a Linux machine with no `.npmrc`, the documented line installs `@stackra/cli` from the real Stackra registry with every other package from npmjs, writes no `.npmrc` in `HOME`, and (with an installable CLI version and a template checkout) writes the app and its `.npmrc` — verified by: the box 2 proof in `stackra-demo` (logged in the pull request); a working app from the line alone waits on STA-2794 and STA-2874
- **SC-002**: every requirement above has a failing test without its code — verified by: unit (the revert checks in the pull request)

## Out of scope

- Claiming the npmjs name `create-stackra`, publishing it to npmjs and the release job that would do it: the owner (external blocker, see Impact; STA-2897). Until the claim, no page names `npm create stackra` as a line to run.
- Making `@stackra/cli@latest` installable and the starter's example service pass `stackra gen` (STA-2794), and publishing `@stackra/starter` (STA-2874).
- Moving every other member's repository URLs to `stackra-inc/stackra` (a repository-wide change of `MEMBER_METADATA`, outside this item).
- A `stackra create --registry` flag: the environment variable carries the choice from the initializer.

## Assumptions

- npm's `--@scope:registry=<url>` config flag keeps working for `npx` (npm 7 and later; checked with npm 11 on Node 24).
- The owner re-registers npm names under ADR 0453 decision 16 anyway, and can claim `create-stackra` with them.

## Amendments

- 2026-11-27 · review of the pull request: tier `feature` → `big` (a new package); the documented line is the
  scope-mapped `npx` line and `npm create stackra` is listed as pending until the owner holds the npmjs name (FR-009,
  AC-009); the npmjs member names `stackra-inc/stackra` (FR-010, AC-008); the proof of 2026-11-27 recorded (SRC-007).

## Status history

- 2026-11-27 · — → Draft · spec author · written from the audit item and the built change
- 2026-11-27 · Draft → Clarified · spec author · questions answered from ADR 0199, ADR 0453 and the box 2 proof
- 2026-11-27 → Planned (plan.md)
- 2026-11-27 → Tasked (tasks.md)
- 2026-11-27 → Implementing (built on the branch, tasks ticked)
- 2026-11-27 · Implementing, amended · spec author · re-tiered `big` after review; FR-009 and FR-010 changed and added
