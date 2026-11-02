# Feature Specification: Engine proof, `stackra create` makes a working app in an empty folder

**Feature Branch**: `figentra/sta-1952-stackra-create`

**Created**: 2026-11-02

**Status**: Draft <!-- Draft → Clarified → Planned → Ready → Implementing → Verified, or Abandoned / Superseded; spec-gate ci checks the artifacts each stage needs -->

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

<!-- Folder: .agents/specs/sta-n-<slug>/, named by the Linear key below (ADR 0120 D1). -->

**Linear**: STA-1952

**Linear project**: none (owner focus, 2026-11-02)

**Clarifications status**: pending <!-- /flow-clarify sets this to "complete" when nothing is open -->

**Input**: Owner request, 2026-11-02: "Same as Laravel new". In a new empty folder, one command asks for the name and a
short questionnaire, fetches the starter, installs, runs gen (visibly: the `.stackra` files, the Encore app), tests, sets
up Flow, and the developer starts dev. Phase 2 is dev, phase 3 deploy, phase 4 a change. The phase 1 app is a web
console plus one service with one module (a resource, an action and a migration).

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none in core
- **Services touched**: none in core
- **Packages touched**: `packages/developer/cli` (the new `stackra create` command, a gen-output tree printer, a
  starter reader); it gains a dependency on `@stackra/console` (same category, `./node` entry) for the banner and the
  prompter, so there is one prompter (STA-1730). `packages/developer/skills` gains a `starter` registry item kind only
  if the leader prefers a kind over a plain package (plan, decision D1). `@stackra/gen` is used, never changed. The
  existing `stackra doctor` (`packages/developer/cli/src/node/doctor/`) is extended with the machine-readiness checks
  (User Story 0); no second doctor is written.
- **Other repositories**: `figentra/stackra-template` gains a `stackra.starter.yaml` profile file, the minimal
  profile's content (an `apps/console` member and one module in `services/example`) and a publish step for
  `@stackra/starter`. Edited only after the leader clears it with the Flow wave (merge-bot session).
- **Cross-service events**: none
- **Tenancy and data**: the starter's module has one table in its own Postgres schema; it is example data, not
  tenant-owned (no tenant column in phase 1; noted as an open question for the module shape)
- **Secrets**: none read or written. `@stackra/*` reads from the registry are open (ADR 0453 decision 10); a Pro edition
  needs `STACKRA_LICENCE_TOKEN`, which `create` only checks for presence and sends only to the registry origin, as
  `stackra add` already does. Deploy secrets (phase 3) are named for the owner, never set by an agent.
- **ADR needed**: yes, ADR 0515 (reserved, stackra#249): "`stackra create` and the published starter" (the fetch channel, one template with
  profiles, the pnpm-only workspace).
- **New dependencies**: none third-party. `@stackra/cli` → `@stackra/console` (`workspace:*`).
- **Deploy modes**: create and dev run on a developer machine; deploy (phase 3) is SaaS through Runway to the app's own
  dev environment, run by the owner.
- **Lane**: full (new command, new published artifact, cross-repository)
- **Change risk**: R2 (a new published artifact and a command that writes to disk and runs installs; no tenant data,
  no auth path)

## User Scenarios & Testing _(mandatory)_

### User Story 0 - Know the machine is ready before anything runs (Priority: P1, owner decision 2026-11-02)

`stackra doctor` checks the machine for what the app needs and explains each problem: mise and every pinned tool, a
running Docker engine, the network to every host the work depends on (each resolved address on port 443), the
registry, GitHub, the Infisical and AWS logins, the Encore CLI (and Pulumi when the app's runway config deploys
infrastructure), disk space and free ports, and, only when the app has a mobile member, the Xcode command-line tools
and a simulator. `stackra doctor --fix` offers each install and asks before each one. `stackra create` runs it first
and offers the fixes; `stackra dev` runs a quick version and stops early with a clear message.

**Why this priority**: the owner's own network drops some GitHub, Fastly and Cloudflare edges and blocks outside DNS.
A create or dev run that fails half-way on the machine, not the code, is the first thing a new user meets.

**Independent Test**: on a ci-box, the check functions run against recorded outputs (a stopped Docker, a missing mise
tool, one GitHub address dropped while its siblings answer, a busy port) and each yields the expected line and fix; a
web-only app yields no Xcode check.

**Acceptance Scenarios**:

1. **Given** a web-only app, **When** doctor runs, **Then** it never checks Xcode or a simulator.
2. **Given** a host whose addresses partly time out while sibling addresses answer, **When** doctor runs, **Then** it
   names the dropped addresses and suggests Cloudflare WARP in WARP mode (not DNS-only).
3. **Given** the registry token is absent, **When** doctor runs, **Then** it says so without printing anything secret
   and names the fix (the Infisical login and how the token is loaded); a present token is never printed.
4. **Given** `--fix`, **When** a fix is available, **Then** doctor asks before each install and runs only the accepted
   ones; without a terminal `--fix` installs nothing and prints the commands.
5. **Given** `stackra dev` and a stopped Docker engine, **When** dev starts, **Then** it stops before starting anything
   and says how to start Docker.

---

### User Story 1 - Create a working app in an empty folder (Priority: P1)

A developer runs `npx @stackra/cli create acme` (or `stackra create acme`). They see the Stackra banner and answer a
short questionnaire. The command fetches the starter, writes it under the chosen names, installs, runs `stackra gen`
and shows what gen wrote as a tree, runs typecheck and tests, sets up Flow, makes the first commit, and prints the next
steps.

**Why this priority**: it is the engine proof's first phase and the owner's focus.

**Independent Test**: on a ci-box, `stackra create /tmp/acme --yes --name acme` in an empty folder ends with exit 0;
the report shows the generated tree; `pnpm typecheck` and `pnpm test` in the result are green; `git log` shows one
commit.

**Acceptance Scenarios**:

1. **Given** an empty or missing folder, **When** `create` runs with no flags in a terminal, **Then** it shows the
   banner and asks, in order: name, npm scope, edition, optional packages, package manager.
2. **Given** a folder that is not empty, **When** `create` runs, **Then** it refuses before asking anything and writes
   nothing.
3. **Given** every answer as a flag (or `--yes` for the defaults), **When** `create` runs without a terminal, **Then**
   it asks nothing and produces the same result.
4. **Given** no `STACKRA_LICENCE_TOKEN`, **When** the edition question is reached, **Then** only `free` is offered, and
   `--edition pro` is refused with the reason.
5. **Given** a finished install, **When** gen runs, **Then** the output shows one line per generated kind and member:
   `.stackra/gen/*`, the Encore app under `.stackra/encore/`, each `stackra.manifest.json`, the entries under
   `.stackra/entry/`.
6. **Given** a step fails (install, gen, typecheck, tests), **When** `create` stops, **Then** it names the step, prints
   its output tail, keeps the folder, and prints the one command that resumes from that step.

---

### User Story 2 - Run the app locally (Priority: P2, planned, built after phase 1 is green)

`stackra dev` in the new app serves the console and the service (Encore locally). The module's resource page renders in
a real browser with zero console errors and its action works end to end. The resource page needs STA-1947.

**Independent Test**: Playwright on a ci-box opens the console, sees the resource list, submits the action, sees the new
row; the console log has no error.

---

### User Story 3 - Deploy to the app's own dev environment (Priority: P2, planned)

`stackra deploy --env dev` ships through Runway. The agent prepares the app's runway files and a dry run, and writes the
owner's account checklist; the owner runs the deploy.

**Independent Test**: `stackra deploy --env dev --dry-run` lists every target and every missing account or secret by
name; the owner's live run serves the console at the dev URL with zero console errors.

---

### User Story 4 - Change the app (Priority: P3, planned)

The developer adds a second module, regenerates, tests and redeploys (owner-run).

**Independent Test**: after the change, `stackra gen --check`, typecheck and tests are green and the dry run lists the
new module's endpoints.

### Edge Cases

- The registry is unreachable: `create` fails before writing, naming the registry origin.
- The running CLI is older or newer than the newest starter: `create` uses the starter whose version equals the CLI's,
  and refuses with the fix (`npx @stackra/cli@<v> create`) when none exists; `--starter <dir|tgz>` overrides.
- The name is not a valid package name, or the scope is not `@kebab`: refused with the rule, re-asked in a terminal.
- `pnpm` is missing: refused with the install hint (`corepack enable` or `mise`), before writing.
- `fflow` is missing: Flow setup is skipped with a warning and the command to run later; it is not a failure.
- `git` is missing or has no identity: the folder is left uncommitted with a warning.
- Ctrl-C mid-way: the folder stays as far as it got; nothing outside it is touched.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `stackra create <directory>` is a command of `@stackra/cli`; `npx @stackra/cli create <directory>` runs
  the same command.
- **FR-002**: it refuses a directory that exists and is not empty, before any question.
- **FR-003**: it shows the banner and asks name, npm scope, edition, optional packages and package manager, through the
  `@stackra/console` prompter. Each has a flag: `--name`, `--scope`, `--edition free|pro`, `--packages <a,b|none>`,
  `--pm`. `--yes` takes every default; without a terminal no question is asked.
- **FR-004**: `pro` is offered only when `STACKRA_LICENCE_TOKEN` is set; the token is never printed and goes only to the
  registry origin.
- **FR-005**: the starter is `@stackra/starter` from the Stackra registry at the CLI's own version, checked against the
  registry's SHA-512 integrity; `--starter <dir|tgz>` reads a local one (pre-release checks).
- **FR-006**: the starter's `stackra.starter.yaml` names profiles; `--profile minimal|full` picks one (default
  `minimal`); only that profile's paths are written.
- **FR-007**: names are rewritten: the root package and runway `project`, the product key, the npm scope of every
  member, the `stackra` catalog pinned to the CLI's version (as `workspaceTemplate` does), and `--tarballs <dir>`
  overrides as `stackra-console create` does.
- **FR-008**: optional packages are installed with the same resolution as `stackra add` (free, then Pro).
- **FR-009**: it runs, each as a visible task: install, `stackra gen`, the gen tree, typecheck, tests, `fflow init` and
  `fflow sync`, `git init` and one commit. `--no-install`, `--no-check`, `--no-flow`, `--no-git` skip a step.
- **FR-010**: the gen tree prints one line per member and generated kind with a file count (FR scenario 5);
  `--verbose` lists every file.
- **FR-011**: on a failed step it exits non-zero, keeps the folder and prints the resume command.
- **FR-012**: it ends with the next steps: `cd <dir>`, `pnpm dev`, and where the docs are.
- **FR-013**: phase 1 is verified only on a ci-box (never on the Mac by an agent); the run log, with the tree, goes on
  STA-1952.
- **FR-014**: `stackra doctor` extends the existing doctor; each check is a pure function over the output of a
  read-only probe, with a test, and yields a `DoctorResult` (name, status, detail, fix).
- **FR-015**: the checks are chosen by what the target needs, read from the workspace (or, before `create` writes
  anything, from the chosen profile): services → Docker, Encore, the Encore and Postgres ports; a root runway that
  deploys infrastructure → Pulumi; a mobile member → Xcode command-line tools and a simulator; the core repository →
  the existing agent checks. Nothing is asked of a target that does not need it.
- **FR-016**: the network check resolves each host through the system resolver, connects to every resolved address
  on port 443 with a TLS handshake and a timeout, and flags an address that fails while a sibling address of the same
  host succeeds; the fix suggests Cloudflare WARP in WARP mode. The host list starts from the owner's net-probe list,
  grouped by need (registry, GitHub, npm and Node, Encore, Cloudflare, AWS, Infisical, Expo).
- **FR-017**: the registry check reads `@stackra` and, when the workspace depends on it, `@figentra` through the
  package manager's own configured auth (a version lookup), so no token is read or printed; a missing token is
  reported as absent with the Infisical login fix.
- **FR-018**: `--fix` asks before each install and runs only through mise for pinned tools (`mise install`); Docker
  (OrbStack or Docker Desktop) and WARP are offered as the vendor's install, with the link. Agents never run `--fix`
  installs on the Mac.
- **FR-019**: `stackra create` runs doctor first (the profile's checks) and offers the fixes before writing; `stackra
dev` runs the quick checks (mise tools, Docker running, free ports; no network probe) and stops early on a failure.

### Key Entities

- **Starter**: the published `@stackra/starter` tarball, built from `figentra/stackra-template`.
- **Profile**: a named path list in `stackra.starter.yaml`; `minimal` (console, one service with one module, docs off)
  and `full` (the whole template).
- **Gen tree**: the grouped view of the paths `stackra gen` wrote.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: on a ci-box, an empty folder reaches green (install, gen, typecheck, tests) with one command and no
  question (`--yes`).
- **SC-002**: the same command on the owner's Mac asks five questions at most.
- **SC-003**: both profiles work end to end, standalone (minimal, with its own `apps/console`) and template (full, the
  product shape): create, gen, dev and the dev environment through Runway. The template's own CI creates and checks
  both on every template pull request, and phase 3's dry run runs for both. Each carries a `runway.yaml` that Runway
  reads the same way; nothing branches on the profile (owner, 2026-11-02).
- **SC-004**: phases 2 to 4 each have a spec section and an issue before phase 1 is closed.
- **SC-005**: on the owner's Mac, `stackra doctor` names every dropped edge address, stopped engine or missing tool
  that would fail a create or dev run, before the run starts; on a ready machine it prints only passes.

## Glossary

- **Starter**: what `create` fetches; not a git clone.
- **Profile**: a filter over the one template, not a second template.

## Assumptions

- `@stackra/*` 0.5.1 is published before the first ci-box run (stackra#246).
- The v3 module kinds the starter's module uses (model, action, query, resource, migration) pass `stackra gen` 0.5.1;
  any refusal goes to the leader as a gen issue, not worked around.
- A product made by `create` is a Stackra workspace with an app member; Figentra OS products (no app members, ADR 0441)
  come later through the OS console and the Control Plane.

## Clarifications

### Session 2026-11-02 (leader review)

- D1 to D5 of the plan are approved as recommended. The ADR is 0515, "`stackra create` and the published starter"
  (reserved in stackra#249).
- **Package manager**: pnpm only. The question is shown with its single choice and skipped by `--yes`.
- **Who publishes `@stackra/starter`**: the template's own release, versioned with the `@stackra/*` line it pins.
- **`stackra new` outside core**: follow-up STA-1954 (ship the scaffold templates in `@stackra/cli`, a `module` kind,
  `new service` writes `src/`), built in phase 4.
- **Template edits**: cleared. Template PR 2 is based on main after the Flow wave's template sync PR lands.

## Open questions _(for /flow-clarify)_

1. **App member in the template** (decided 2026-11-02 by the owner: an `apps/console` member in the minimal profile only, ADR 0515 decision 6): the template follows ADR 0441 (no app members; surfaces built by
   Runway around packages, `os/console@3`). The phase 1 console needs an `apps/console` member, in the minimal profile
   only. ADR 0441 governs Figentra products, which run in OS shells; a standalone Stackra app has no OS shell, and the
   shell needs an OS checkout, so it cannot run from an empty folder. Recommendation: an app member. `apps/` is not
   touched until the owner confirms.
2. **The module's shape**: `notes` with a `Note` model, a `note` resource, `note.create` and `note.list`, and one
   migration. Tenant-owned or not in phase 1? Recommendation: not tenant-owned; phase 2 shows it without login.
