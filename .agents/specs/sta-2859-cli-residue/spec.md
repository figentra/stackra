# Feature Specification: the CLI's doctor, dev tunnel and starter carry no Figentra-internal advice

**Feature Branch**: `figentra/sta-2859-cli-residue`

**Created**: 2026-11-26

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-2859

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: The production-readiness audit of 26 November (item 13.3) found that people outside Figentra who run
`stackra doctor`, `stackra dev --tunnel`, `stackra mcp exec`, `stackra new service` or `stackra create` get advice and
files that only make sense inside Figentra: the network row tells them to switch on Cloudflare WARP, the registry and
secrets rows and the tunnel error point at a `figentra/secrets` clone and Figentra's own scripts, a new service's
`runway.yaml` says its secrets come from `figentra/secrets`, and doctor finds tools by running `which`, which Windows
does not have (so every tool reads as installed there). The template's starter also hands every new app its
Figentra-only approval and baseline workflows, which a starter profile had no way to leave out.

### Sources

- FR-001 to FR-003: `packages/developer/cli/src/node/doctor/functions/doctor-checks.function.ts` (`WARP_FIX`, `which`,
  the secrets rows) and STA-1952 spec FR-014 to FR-017 (doctor); FR-001 also ADR 0027 (tools from mise)
- FR-004: `packages/developer/cli/src/node/dev-surface/constants/dev-command.constant.ts` and
  `packages/developer/cli/src/node/dev-tunnel/functions/start-tunnel.function.ts` (the tunnel token advice), ADR 0290
  (decisions 4 and 5: the dev tunnel)
- FR-005: `packages/developer/cli/src/node/functions/service-template.function.ts` (a new service's `runway.yaml`
  header), ADR 0525 (sops)
- FR-006: `packages/developer/mcp/src/core/functions/mcp-exec-command.function.ts` (the missing-checkout error), ADR 0525
- FR-007: `packages/developer/cli/src/node/create/functions/starter-files.function.ts` and
  `packages/developer/cli/src/node/create/types/starter-manifest.type.ts` (the starter profile filter), stackra-template
  `stackra.starter.yaml`, `.github/workflows/fflow-approve.yml`, `.github/workflows/fflow-baseline.yml`, ADR 0515
  (decisions 3 and 5: the starter manifest)
- FR-001 to FR-007: the production-readiness audit of 26 November (item 13.3), the branch's diff against `main` and its
  tests

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/cli (doctor, dev tunnel, `stackra new service`, `stackra create`'s starter
  filter), packages/developer/mcp (`mcpExecCommand`'s error and docs)
- **Public contract change**: additive. The `stackra.starter.yaml` profile format gains an optional `exclude` list of
  globs (`StarterManifest`); a manifest without it behaves as before, and an older CLI ignores the key. `doctorChecks`
  gains an optional fourth parameter (`deps.probe`); the package exports no entry for it. One doctor row is renamed:
  `figentra/secrets clone` is now `secrets checkout` (its `--json` name changes, its group stays Repo). The other
  changes are message text.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none; no secret value is read, printed or written, and the secrets-checkout location
  (`STACKRA_SECRETS_DIR`, default `~/.stackra/secrets`) is unchanged.
- **Secrets**: none (names only: `CLOUDFLARE_TUNNEL_TOKEN`, `STACKRA_SECRETS_DIR`)
- **ADR needed**: no (ADR 0515 decision 5 already makes a profile a path filter; `exclude` refines that filter)
- **New dependencies**: none
- **Deploy modes**: same in all three (developer tooling only)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/developer/cli/README.md` (doctor row, `mcp exec` row), a minor changeset for
  `@stackra/cli`, a patch changeset for `@stackra/mcp`; in stackra-template: the `stackra.starter.yaml` header and its
  profiles
- **Lane**: full (a file-format addition and a renamed doctor row)
- **Change risk**: R1 (developer tooling; a script that matched the old `figentra/secrets clone` row name sees the new
  name)

## Glossary _(full lane)_

- **Residue**: advice or files that name Figentra's own repositories, scripts, accounts or VPN product, which a person
  outside Figentra cannot act on.
- **Secrets checkout**: the local folder of sops-encrypted secrets that `secrets-exec.mjs`, `stackra mcp exec` and the
  doctor's secrets rows read (`STACKRA_SECRETS_DIR`, default `~/.stackra/secrets`).
- **Starter profile**: one entry of `profiles` in `stackra.starter.yaml`: `include` globs, optional `exclude` globs and
  optional `overlay` files.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Doctor's advice works for anyone (Priority: P1)

A developer outside Figentra runs `stackra doctor` on a network that blocks a registry host. The network row tells them
to look at their connection, proxy, VPN or firewall; the registry, sops and secrets rows tell them what to set up
without naming Figentra's repositories or scripts.

**Independent Test**: `doctorChecks` on a workspace that needs every advice row, with an injected network where no host
answers and an empty `PATH`, then every row's name, detail and fix read for internal names.

**Acceptance Scenarios**:

1. **Given** a host that answers on no address, **When** doctor runs, **Then** the network row fails and its fix names
   the connection, a proxy, a VPN or a firewall and no vendor product.
2. **Given** a workspace that reads `@figentra`, runs `secrets-exec` and has `agents:check`, **When** doctor runs,
   **Then** no row names `figentra/secrets`, `figentra/infra`, WARP or `secrets-exec`, and the secrets row is
   `secrets checkout`.

---

### User Story 2 - Doctor finds tools on Windows (Priority: P1)

A developer on Windows runs `stackra doctor`. Each tool is found or reported missing from `PATH` (`Path`) and
`PATHEXT`, without a `which` program.

**Independent Test**: `commandOnPath` with temporary folders and an injected file check for Windows paths; `doctorChecks`
with an empty `PATH` (no `which`).

**Acceptance Scenarios**:

1. **Given** `Path=C:\Tools` holding `gh.EXE` and `PATHEXT=.COM;.EXE;.CMD`, **When** doctor asks for `gh`, **Then** it
   is found; `mise` is not.
2. **Given** a `PATH` with neither `mise` nor `which`, **When** the quick doctor runs, **Then** its first row is
   `mise installed: fail, not on PATH` (before, `mise` read as installed).

---

### User Story 3 - The tunnel, `mcp exec` and a new service name no internal repository (Priority: P2)

**Acceptance Scenarios**:

1. **Given** no `CLOUDFLARE_TUNNEL_TOKEN`, **When** `stackra dev --tunnel` runs, **Then** it refuses and says to set
   the token in the environment for that run, with a sops example, and names no Figentra script or repository; the
   usage line says the same.
2. **Given** `stackra mcp exec` with a secret and no checkout, **Then** the error names `STACKRA_SECRETS_DIR` and its
   default.
3. **Given** `stackra new service`, **Then** its `runway.yaml` header says secret values come from your secret store
   through runway.

---

### User Story 4 - A starter keeps its own tooling out of apps (Priority: P1)

The template lists its approval and baseline workflows under `exclude` in both profiles, so `stackra create` writes
every other file its `include` globs match but not those.

**Acceptance Scenarios**:

1. **Given** a profile with `include: ["**"]` and `exclude: [".github/workflows/fflow-*.yml"]`, **When** `stackra
create` writes the app, **Then** `.github/workflows/ci.yml` is written and the two fflow workflows are not.
2. **Given** a profile that excludes `runway.yaml` and overlays it, **Then** the overlay is written.
3. **Given** `exclude` that is not a list of strings, **Then** the manifest is refused as not version 1.

---

### Edge Cases

- **EC-01**: A `PATH` with empty entries (`::`) skips them; an environment without `PATH` finds nothing.
- **EC-02**: Off Windows a file without the execute bit, or a folder, of the command's name is not a tool.
- **EC-03**: On Windows a bare name is only tried with a `PATHEXT` extension; a name with an extension (`gh.exe`) is
  tried as given first; with `PATHEXT` unset the default `.COM;.EXE;.BAT;.CMD` applies.
- **EC-04**: A command with a folder in it (`./bin/tool`) is checked as that path, not searched.
- **EC-05**: `exclude` follows the same dot-path rule as `include` (a `.github/...` glob matches dot paths).
- **EC-06**: A manifest without `exclude` writes exactly what it wrote before.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE doctor SHALL decide whether a tool is installed by searching `PATH` itself (`commandOnPath`): on
  Windows the `Path` key matched without case and each `PATHEXT` extension, elsewhere an executable file; it SHALL NOT
  run `which`.
- **FR-002**: THE doctor's network row SHALL fail when a host answers on no address and warn when an address is dropped
  while a sibling answers, and its fix SHALL name generic steps (connection, proxy, VPN, firewall), never a vendor
  product.
- **FR-003**: THE doctor's `@figentra` registry, Google login and secrets rows SHALL name no Figentra repository, script
  or person; the secrets row SHALL be named `secrets checkout`.
- **FR-004**: WHEN `stackra dev --tunnel` runs without `CLOUDFLARE_TUNNEL_TOKEN` THE CLI SHALL refuse with advice to set
  it in the environment for that run, naming no Figentra script or repository; the usage text SHALL say the same.
- **FR-005**: THE `runway.yaml` that `stackra new service` writes SHALL say secret values come from the product's secret
  store through runway.
- **FR-006**: WHEN `stackra mcp exec` names a secret and no secrets checkout is given THE CLI SHALL say which variable
  and default it reads.
- **FR-007**: THE starter manifest SHALL accept an optional `exclude` list of globs per profile; `stackra create` SHALL
  leave out every file an `exclude` glob matches, still write overlays, and refuse an `exclude` that is not a list of
  strings.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN no host answers THE doctor SHALL fail the network row with a fix that names no vendor product.
- **AC-002**: WHERE a workspace needs every advice row THE doctor SHALL produce no row that names `figentra/secrets`,
  `figentra/infra`, WARP or `secrets-exec`.
- **AC-003**: WHEN neither `mise` nor `which` is on `PATH` THE quick doctor SHALL report `mise installed` as failed.
- **AC-004**: WHEN `PATHEXT` and `Path` name a Windows tool THE doctor's lookup SHALL find it, and SHALL NOT find a
  bare name without an extension.
- **AC-005**: WHEN the tunnel token is missing THE CLI SHALL refuse with generic advice.
- **AC-006**: WHEN a profile excludes files THE starter SHALL leave them out and still write its overlays.

## Success Criteria _(mandatory)_

- **SC-001**: `command-on-path.function.test.ts`, `network-check.function.test.ts` and `doctor-checks.function.test.ts`
  prove FR-001 to FR-003 and fail on the previous `doctor-checks.function.ts` — verified by: unit
- **SC-002**: `start-tunnel.function.test.ts`, `dev-command.constant.test.ts`, `service-template.function.test.ts` and
  `mcp-exec-command.function.test.ts` prove FR-004 to FR-006 — verified by: unit
- **SC-003**: `create.test.ts` proves FR-007 and fails on the previous `starter-files.function.ts` — verified by: unit
- **SC-004**: the `@stackra/cli` and `@stackra/mcp` tests, typecheck, oxlint and oxfmt pass — verified by: manual

## Compatibility and migration

- A script that reads doctor's `--json` and matches `figentra/secrets clone` must match `secrets checkout`.
- A starter manifest without `exclude` is unchanged. A CLI older than this change ignores `exclude` and writes the
  excluded files, as before; the template's `exclude` takes effect from the release that carries it.
- `doctorChecks(root, workspace, options)` callers need no change.

## Risks

- **R-1**: Windows `PATHEXT` semantics differ slightly by shell (PowerShell adds `.PS1` for its own lookup); doctor
  follows the process rules `spawn` uses, which is what doctor's later `spawnSync` calls see.
- **R-2**: The template still carries other fflow-generated files (`.flow/`, `flow.config.json`, the guard hook) and a
  CI registry step that reads Figentra's secrets; those move with STA-2790 (fold fflow into `stackra`) and a starter CI
  follow-up.

## Out of scope

- Folding fflow into the `stackra` CLI (STA-2790).
- Building `stackra agents setup` (ADR 0282 decision 10); the template's broken `agents:setup` script is removed instead.
- The starter CI's registry-auth action (decrypts from Figentra's secrets).

## Assumptions

- A tool doctor can find on `PATH` is one `spawnSync` can start, on every platform Node supports.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-2859 session) · created from the branch's diff
- 2026-11-26 · Draft → Clarified · Claude (STA-2859 session) · clarifications complete
- 2026-11-26 · Clarified → Planned · Claude (STA-2859 session) · plan.md
- 2026-11-26 · Planned → Tasked · Claude (STA-2859 session) · tasks.md
- 2026-11-26 · Tasked → Implementing · Claude (STA-2859 session) · T001 to T010 on the branch
