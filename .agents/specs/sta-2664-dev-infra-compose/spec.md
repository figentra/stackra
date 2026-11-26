# Feature Specification: stackra dev runs the dev compose of environments.dev.infra

**Feature Branch**: `figentra/sta-2664-dev-infra-compose`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: CTO

**Linear**: STA-2664

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: STA-2664 item 6 ("`environments.dev.infra`: nothing beyond the gateway port is read: no compose, no otel")
and the production-readiness audit of 2026-11-26, batch 13 item 13.1: `stackra dev` starts only the Postgres Encore
brings, so an app that picks the Valkey cache, the S3 disk, an SMTP mail driver or the ClamAV scanner cannot run
locally. `git grep` on origin/main finds no compose emitter in gen or runway.

## Problem

ADR 0199 decision 3 says `stackra dev` runs gen, `encore run` and a small compose file. The compose file was never
built. The root runway's `environments.dev.infra` block is an open record that only the port check and the surface
mode's gateway port read; `writeDevFacts` writes no infra address ("Infra ports are not written yet"), so a
`from-port: <infra>` var cannot resolve. `stackra dev secrets init` tells the developer to "let the dev compose
provide" connection strings that nothing provides.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/runway, packages/developer/cli
- **Public contract change**: additive. `@stackra/runway` exports `devComposeOf`, `DEV_INFRA_KINDS` and the types
  `ComposeDocument`, `ComposeService`, `DevComposeInput`, `DevComposePlan`, `DevInfraHealthcheck`, `DevInfraIssue`,
  `DevInfraKind`, `DevInfraService`; the dev facts file gains `infra` entries (the schema already had the field);
  `stackra dev` gains `--infra` and `--no-infra`; the root runway schema's `environments.dev.infra` descriptions name
  the kinds. No existing field changes meaning.
- **Cross-service events**: none
- **Tenancy and data**: none; dev only, every container on 127.0.0.1
- **Security and privacy**: containers are published on the loopback interface only; no credential is planned or
  written (the SeaweedFS store checks no signature, so its placeholder key pair is not a secret); the state file holds
  a lane and names only
- **Secrets**: none
- **ADR needed**: no; implements ADR 0199 decision 3 within ADR 0296 decision 1 (lanes) and ADR 0170 (a port is written
  once)
- **New dependencies**: none (`yaml` is already the CLI's); Docker with the compose plugin on the developer machine,
  which `stackra doctor` already checks for services
- **Deploy modes**: dev only; SaaS, on-prem and air-gapped deploys are unchanged
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/developer/runway/README.md` (the dev compose section), `packages/developer/cli/README.md`
  (`stackra dev`), `tools/schemas/runway-root.schema.json` and its byte copy `packages/developer/runway/schema/root.json`
  (the `environments.dev.infra` descriptions)
- **Lane**: full
- **Change risk**: R2 (a new step before every member `stackra dev` run that declares a container)

## Requirements

### Functional Requirements

- **FR-001**: WHEN the root runway declares a dev infra block other than `gateway` or `postgres` THE plan SHALL make it
  one Compose service published on 127.0.0.1 at the runway's host port.
- **FR-002**: THE plan SHALL move every per-lane port by lane × `lanes.portStep`, and put a `perLane: false` block
  (ClamAV's default) unmoved in the project every lane shares.
- **FR-003**: THE plan SHALL give a member's run the variables of each started container: the five `*_VALKEY_URL`
  names, `AWS_ENDPOINT_URL_S3` with a placeholder key pair, `SMTP_HOST` and `SMTP_PORT`, and
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- **FR-004**: IF a block has no image, misses a port its kind listens on, names an unknown kind without
  `containerPorts`, has a bad bucket or `when`, or gives a variable another block gives THEN THE plan SHALL refuse it
  by code and plan no file.
- **FR-005**: WHEN `stackra dev` runs in a member or at the root THE command SHALL write the Compose files and run
  `docker compose up --detach --wait` for each one with a container to start, the shared file first, before the tool.
- **FR-006**: WHILE a `when: opt-in` block is not named by `--infra` THE command SHALL NOT start it or give its
  variables.
- **FR-007**: WHEN a member's `stackra dev` starts its tool THE tool SHALL get the dev compose's variables unless the
  shell or the dev-secrets file sets them.
- **FR-008**: THE dev facts writer SHALL write the gateway's and each planned container's address.
- **FR-009**: WHEN the dev compose provides a name THE dev secrets init SHALL list it as the compose's, not as needing
  a value.

## Acceptance criteria

- **AC-001**: WHEN a block names a known kind THE plan SHALL publish each of its ports as `127.0.0.1:<host>:<container>`.
- **AC-002**: WHEN the lane is 2 and `portStep` is 100 THE plan SHALL move a per-lane Valkey on 6379 to 6579.
- **AC-003**: WHEN ClamAV has no `perLane` THE plan SHALL put it in `<project>-dev-shared` on its own port.
- **AC-004**: WHEN SeaweedFS names buckets THE plan SHALL pass them to `weed mini -bucket=` and wait for the last one.
- **AC-005**: IF any block is refused THEN THE plan SHALL return no Compose file and no variable.
- **AC-006**: WHEN the runway declares only Encore's own blocks THE command SHALL run no Docker.
- **AC-007**: IF Docker cannot start THEN THE command SHALL exit with its code and name `--no-infra`.
- **AC-008**: WHEN a variable is already in the shell THE member's run SHALL keep the shell's value.
- **AC-009**: IF `--infra` or `--no-infra` is given with `--surface`, `--mobile` or `--product` THEN THE command SHALL
  exit 2.
- **AC-010**: WHEN the dev facts are written for lane 1 THE file SHALL hold the gateway and Valkey addresses moved by
  the lane, and ClamAV's unmoved.

## Success Criteria

- **SC-001**: the runway and CLI unit tests for AC-001 to AC-010 pass, and each fails with its change reverted —
  verified by: unit
- **SC-002**: on box 2's `stackra-demo` container, the generated Compose file brought up with the pinned Valkey,
  SeaweedFS and Mailpit images reaches healthy, and the real `ValkeyCacheDriver`, `S3FileSystemDriver` (endpoint
  `null`) and a plain SMTP client reach them with only the variables `devInfraEnv` gives — verified by: manual (proof
  log in the pull request)

## Design

### Summary

Runway plans (pure), the CLI writes and starts (node). `devComposeOf` turns the root runway's dev infra block into two
Compose documents and a variable map; `startDevInfra` writes them and runs Docker; `devInfraEnv` gives a member's run
the same variables later.

### Architecture overview

`stackra dev` (member or root mode) → `writeDevFacts` (now with infra addresses) → `startDevInfra` → `planDevInfra`
(`readRunway` + `devComposeOf`) → `.stackra/dev/compose.yaml`, `.stackra/dev/compose.shared.yaml`,
`.stackra/dev/infra.json` → `docker compose -f <file> [--profile <name>] up --detach --wait [--remove-orphans]` → the
member tool, whose environment `toolCommand` builds as `tool.env`, then `devInfraEnv`, then `devSecretEnv`.

### Components and responsibilities

- `@stackra/runway` core: `DEV_INFRA_KINDS` (ports, primary address, lane sharing, command, volume, health check,
  buckets, member variables per kind) and `devComposeOf` (validation, lane shift, documents, variables).
- `@stackra/runway` node: `writeDevFacts` adds `infra`.
- `@stackra/cli`: `planDevInfra`, `startDevInfra`, `readDevInfraState`, `devInfraEnv`, the `--infra`/`--no-infra`
  flags in `DEV_COMMAND`, the variable layer in `toolCommand`, the compose-provided list in `stackra dev secrets init`.

### Files and folders

`packages/developer/runway/src/core/{constants/dev-infra-kinds.constant.ts,functions/dev-compose-of.function.ts,types/{compose-document,compose-service,dev-compose-input,dev-compose-plan,dev-infra-healthcheck,dev-infra-issue,dev-infra-kind,dev-infra-service}.type.ts}`;
`packages/developer/cli/src/node/dev-infra/` (constants, functions, types, tests).

### Data models and migrations

None. Generated files only, under the gitignored `.stackra/dev/`.

### Contracts

Additive exports listed under Impact. The Compose documents follow the Compose specification. The dev facts `infra`
field keeps its schema (`port`, `url`).

### Error handling

A refusal prints `environments.dev.infra <code>: <message>` per issue and exits 1 before writing. Docker that cannot
start exits 127 with the `stackra doctor` and `--no-infra` hint; any other Docker failure exits with its code and names
`docker compose logs`.

### Security and tenancy

Loopback-only ports; no credential written; state file has no value.

### Testing strategy

Unit tests per component with a fake process runner; a revert check per behaviour; a real-container proof on box 2.

### Rollout

Changesets: minor for `@stackra/runway` and `@stackra/cli`. Products opt in by adding blocks to
`environments.dev.infra`; a runway with only `gateway` and `postgres` behaves as before.

## Out of scope

- Turning a driver set to `memory` in every service into "no container" (the old schema description's idea).
- A `stackra dev infra down` command (the printed `docker compose … down` covers it).
- Runway `config` values reaching a local service's config classes (the boot layer reads env and secrets only).
- A MinIO kind: MinIO publishes no community image any more; a product that mirrors one spells `containerPorts`.

## Assumptions

- Developer machines have Docker with the compose plugin when they declare a container (`stackra doctor`).
- `turbo` sets `TURBO_HASH` in every task it runs, so a member run started by the root run skips the step.

## Status history

- 2026-11-26 · — → Draft · Stackra readiness lane (Claude) · from STA-2664 item 6 and audit item 13.1
- 2026-11-26 · Draft → Implementing · Stackra readiness lane (Claude) · built on box 2; awaiting the approver's line
