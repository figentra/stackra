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
locally. `git grep` on origin/main finds no compose emitter in gen or runway. ADR 0199 decision 3 says `stackra dev`
runs gen, `encore run` and a small compose file; the compose file was never built. The root runway's
`environments.dev.infra` block is an open record that only the port check and the surface mode's gateway port read;
`writeDevFacts` writes no infra address ("Infra ports are not written yet"), so a `from-port: <infra>` var cannot
resolve, and `stackra dev secrets init` tells the developer to "let the dev compose provide" connection strings that
nothing provides. The review of 2026-11-26 added two findings, both fixed here: SeaweedFS's placeholder AWS key pair
must not shadow a developer's own AWS credential for the run's other AWS clients, and the S3 write path needed a real
proof.

### Sources

- ADR 0199 decision 3 (`stackra dev` runs gen, `encore run` and a small compose file); ADR 0296 decision 1 (dev ports
  and lanes); ADR 0170 (a port is written once); ADR 0222 decision 1 (an S3-compatible disk); ADR 0184 (OTLP
  everywhere); ADR 0173 (no secret values in config); ADR 0525 amendment of 2026-11-10 (dev values by name)
- `packages/developer/runway/src/node/functions/write-dev-facts.function.ts` (the dev facts before the change)
- `packages/developer/cli/src/node/dev-surface/constants/dev-command.constant.ts`,
  `packages/developer/cli/src/node/functions/tool-command.function.ts` (the `stackra dev` flow)
- `packages/developer/cli/src/node/commands/dev-secrets-init.command.ts` (the "needs a value" list)
- `packages/data/filesystem/src/node/drivers/s3-file-system.driver.ts` (the S3 disk reads the AWS default credential
  chain and `AWS_ENDPOINT_URL_S3`), `packages/runtime/cache/src/node/drivers/valkey-cache.driver.ts`
- `weed mini -h` of `chrislusf/seaweedfs:4.45` (`-bucket`, no identity by default), the pinned images' health commands
- The review of 2026-11-26 on this branch (global AWS keys; the unproven S3 write path) and its real-container proof
- Linear STA-2664; the readiness audit, batch 13 item 13.1

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/runway, packages/developer/cli
- **Public contract change**: additive. `@stackra/runway` exports `devComposeOf`, `DEV_INFRA_KINDS` and the types
  `ComposeDocument`, `ComposeService`, `DevComposeInput`, `DevComposePlan`, `DevCredentialFallback`,
  `DevInfraHealthcheck`, `DevInfraIssue`, `DevInfraKind`, `DevInfraService`; the dev facts file gains `infra` entries
  (the schema already had the field); `stackra dev` gains `--infra` and `--no-infra`; the root runway schema's
  `environments.dev.infra` descriptions name the kinds. No existing field changes meaning.
- **Cross-service events**: none
- **Tenancy and data**: none; dev only, every container on 127.0.0.1
- **Security and privacy**: containers are published on the loopback interface only; no credential is planned or
  written. The SeaweedFS store has no identity configured and accepts any signature, so its placeholder AWS key pair
  is not a secret, and it is given only to a run with no AWS credential of its own: a developer's profile, SSO or key
  variables are never shadowed for the run's other AWS clients. The state file (`.stackra/dev/infra.json`) holds the
  lane and the names of the opt-in blocks started, never a value, credential or address. SeaweedFS runs with its
  telemetry off (`-master.telemetry=false`), so a dev run reports nothing to telemetry.seaweedfs.com.
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
  (the `environments.dev.infra` descriptions), the changesets `.changeset/runway-dev-compose.md` and
  `.changeset/cli-dev-compose.md`
- **Lane**: full
- **Change risk**: R2 (a new step before every member `stackra dev` run that declares a container)

## Acceptance criteria

- **AC-001**: WHEN a block names a known kind THE plan SHALL publish each of its ports as `127.0.0.1:<host>:<container>`.
- **AC-002**: WHEN the lane is 2 and `portStep` is 100 THE plan SHALL move a per-lane Valkey on 6379 to 6579.
- **AC-003**: WHEN ClamAV has no `perLane` THE plan SHALL put it in `<project>-dev-shared` on its own port.
- **AC-004**: WHEN SeaweedFS names buckets THE plan SHALL pass them to `weed mini -bucket=` and wait for the last one.
- **AC-005**: IF any block is refused THEN THE plan SHALL return no Compose file and no variable; a block is refused
  by code when it has no image, misses a port its kind listens on, names an unknown kind without `containerPorts`, has
  a bad bucket or `when`, or gives a variable another block gives.
- **AC-006**: WHEN the runway declares only Encore's own blocks THE command SHALL run no Docker.
- **AC-007**: IF Docker cannot start THEN THE command SHALL exit with its code and name `--no-infra`.
- **AC-008**: WHEN a variable is already in the shell or the dev-secrets file THE member's run SHALL keep that value.
- **AC-009**: IF `--infra` or `--no-infra` comes in surface, mobile or product mode THEN THE command SHALL exit 2.
- **AC-010**: WHEN the dev facts are written for lane 1 THE file SHALL hold the gateway and Valkey addresses moved by
  the lane, and ClamAV's unmoved.
- **AC-011**: WHILE a member's run has its own AWS credential THE run SHALL get no placeholder AWS key pair, only
  `AWS_ENDPOINT_URL_S3`; its own credential is `AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, a web identity token, a container
  credential endpoint, `~/.aws/credentials` or `~/.aws/config`, the dev-secrets file's values included.
- **AC-012**: IF a member's run has no AWS credential source THEN THE run SHALL get SeaweedFS's placeholder key pair.
- **AC-013**: WHEN a container starts THE member's run SHALL get its variables: the five `*_VALKEY_URL` names,
  `AWS_ENDPOINT_URL_S3`, `SMTP_HOST` and `SMTP_PORT`, and `OTEL_EXPORTER_OTLP_ENDPOINT`.
- **AC-014**: WHEN `stackra dev` runs in a member or at the root THE command SHALL write the Compose files and run
  `docker compose up --detach --wait` for each one with a container to start, the shared file first, before the tool.
- **AC-015**: WHILE a `when: opt-in` block is not named by `--infra` THE command SHALL NOT start it or give its
  variables.
- **AC-016**: WHEN the dev compose provides a name THE dev secrets init SHALL list it as the compose's, not as needing
  a value.
- **AC-017**: WHEN the generated Compose file runs in a Linux container with Docker THE real drivers SHALL reach it with only the
  variables `devInfraEnv` gives: `ValkeyCacheDriver`, `S3FileSystemDriver` (endpoint `null`) and an SMTP client, both
  for a developer with no AWS credential and for one with a default profile.
- **AC-018**: WHEN the plan has a SeaweedFS block THE plan SHALL run `weed mini` with `-master.telemetry=false`, with or
  without buckets.

## Success Criteria

- **SC-001**: the runway and CLI unit tests for AC-001 to AC-016 pass, and each behaviour test fails with its change
  reverted — verified by: unit
- **SC-002**: AC-017 in a Linux container with Docker: PutObject, GetObject, HeadObject, ListObjectsV2, a presigned GET, a presigned PUT and
  DeleteObject through the S3 disk, a cache put, get and forget through Valkey, and a mail in the Mailpit inbox —
  verified by: manual (proof log in the pull request)

## Compatibility and migration

- A root runway that already lists containers under `environments.dev.infra` (for example `valkey`, `seaweedfs`,
  `mailpit`, `clamav` or `otel-lgtm` with an `image`) now has `stackra dev` start them with Docker before the tool, in a
  member and at the root, and stop the run if Docker cannot start them. Before this change the block was read only for
  its ports. A developer without Docker, or who runs those services another way, passes `--no-infra` to skip the step;
  a block marked `when: opt-in` starts only when named by `--infra <name>`.
- A runway that declares only Encore's own blocks (`gateway`, `postgres`) runs no Docker and behaves as before.
- The member's run now gets the compose's variables (`*_VALKEY_URL`, `AWS_ENDPOINT_URL_S3`, `SMTP_HOST`, `SMTP_PORT`,
  `OTEL_EXPORTER_OTLP_ENDPOINT`) unless the shell or the dev-secrets file already sets them; a value a developer set
  keeps winning.
- A run with no AWS credential source of its own gets SeaweedFS's placeholder AWS key pair; a run with one keeps it.
- `stackra dev secrets init` lists the names the compose provides as the compose's, no longer as needing a value.
- The dev facts file gains `infra` entries; its schema already allowed the field.

## Out of scope

- Turning a driver set to `memory` in every service into "no container" (the old schema description's idea).
- A `stackra dev infra down` command (the printed `docker compose … down` covers it).
- Runway `config` values reaching a local service's config classes (the boot layer reads env and secrets only).
- A MinIO kind: MinIO publishes no community image any more; a product that mirrors one spells `containerPorts`.
- Seeing an EC2 instance role as an AWS credential source (it needs a network call; an empty `~/.aws/config` keeps the
  placeholder pair out on such a host).

## Assumptions

- Developer machines have Docker with the compose plugin when they declare a container (`stackra doctor`).
- `turbo` sets `TURBO_HASH` in every task it runs, so a member run started by the root run skips the step.
- SeaweedFS needs 1 % of its data disk free to write; on a fuller disk its volume server refuses every write (a PUT
  hangs), which is what the first review probe met on a test machine whose disk was full.

## Status history

- 2026-11-26 · — → Draft · Stackra readiness lane (Claude) · from STA-2664 item 6 and audit item 13.1
- 2026-11-26 · Draft → Implementing · Stackra readiness lane (Claude) · built and proven in a Linux container; awaiting the approver's line
- 2026-11-26 · Implementing → Implementing · Stackra readiness lane (Claude) · review fixes: the placeholder AWS pair
  only without an AWS credential source (AC-011, AC-012); the AC-017 proof with both credential cases; the design moved
  to plan.md (ADR 0502)
- 2026-11-27 → Planned (plan.md) — Approved by Idris (CTO) 2026-11-27
- 2026-11-27 · Implementing → Implementing · Stackra readiness lane (Claude) · CTO conditions: the Compatibility and
  migration section (existing infra blocks now start Docker; `--no-infra`), the Security sentence finished, SeaweedFS
  telemetry off (AC-018), no internal machine names
