# Feature Specification: `stackra dev secrets init` writes generated dev values and `stackra dev` injects them

**Feature Branch**: `figentra/sta-2679-dev-secrets`

**Created**: 2026-11-10

**Status**: Tasked

**Tier**: feature

**Approver**: leader (decided under the owner's delegation, 2026-11-10)

**Linear**: STA-2679

**Clarifications status**: complete

**Input**: STA-2664 item 4 (local secrets), 0.33.1 item 5. `stackra dev` loads no secrets, so a service whose
configuration reads a required `@Secret` at boot cannot start locally. The runway secret reader runs only in GitHub
Actions (sops). A running service already reads every `@Secret` from its process environment by name (`envSecrets`
in `@stackra/app`), and each member's committed `stackra.manifest.json` lists its secret names (`env` rows, its
packages' included), so a dev value only has to reach the member's own process.

### Sources

- `packages/runtime/app/src/core/functions/env-secrets.function.ts` (the `SecretStore` over `process.env`)
- `packages/developer/gen/src/core/functions/env-of.function.ts` (the manifest `env` rows)
- `packages/developer/cli/src/node/functions/tool-command.function.ts`, `run-process.function.ts` (`ToolRun.env`)
- `turbo.jsonc` (`envMode: strict`: a variable set at the root never reaches a member's task)
- `packages/runtime/outbox/src/core/drivers/ed25519-event-signer.driver.ts` (the relay key is an Ed25519 key pair)
- ADR 0525 (sops is the home of every real value)

## Clarifications

- **Session 2026-11-10 (leader)**: option 1 of three (a gitignored JSON file, not `.env` and not per-run values). One
  file per repository, because a name two members share must hold one value. Init never generates a value for a
  connection-shaped name or a declared url format; it lists it as needing a value. `--from <file>` copies matching
  names from another repository's file. The `encore run` environment pass-through is an assumption os-7c proves.

## Impact

- **Apps touched**: none
- **Services touched**: none (a service's local `stackra dev` gains its declared dev values)
- **Packages touched**: packages/developer/cli (a command, the dev-secrets functions, the dev tool run, the testbed
  excludes); packages/infrastructure/infra-testbed (the box's copy of the excludes)
- **Public contract change**: a new command, `stackra dev secrets init [--rotate] [--from <file>]`
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: generated dev values on the workstation only: a gitignored file, mode 600, never printed,
  never uploaded to a testbed box, never in sops
- **Secrets**: generated dev values only; no real value is read or written
- **ADR needed**: yes, an amendment note on ADR 0525
- **New dependencies**: none
- **Deploy modes**: dev only; no deployed environment reads the file
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: ADR 0525
- **Lane**: full
- **Change risk**: R2 (secret handling on a workstation)

## Acceptance criteria

- **AC-001**: WHEN `stackra dev secrets init` runs in a workspace THE command SHALL write one random value for each
  required `secret` row that dev needs, across every non-package member's manifest, to `.stackra/dev-secrets.json`
  under the workspace root, with mode 600, and SHALL print names and counts, never a value.
- **AC-002**: THE command SHALL NOT generate a value for an optional row, a connection-shaped name (ending `_URL`,
  `_DSN`, `_ENDPOINT` or `_HOST`, a `url` type or a url or dsn rule) or the events relay's signing key (an Ed25519
  key pair); it SHALL list the required ones as needing a value.
- **AC-003**: WHEN the file exists THE command SHALL add only the missing names, and SHALL refuse when none is
  missing unless `--rotate`, which regenerates every generated name and keeps the names set by hand.
- **AC-004**: WHEN `--from <file>` is given THE command SHALL copy the values of matching names from that file
  instead of generating them.
- **AC-005**: WHEN `stackra dev` starts a member's tool THE run SHALL add the file's values for the member's own
  declared secret names to the tool's environment, and nothing when the file is absent.
- **AC-006**: THE testbed upload SHALL exclude `.stackra/dev-secrets.json`.
- **AC-007**: WHEN a member's runway lists names under `environments.dev.secrets` THE command SHALL treat each as a
  required dev secret, optional in the configuration or not (a connection-shaped one still needs a value set by hand),
  and the dev run SHALL inject them for that member (PAY, pay#227: its keys are optional because production reads KMS).

## Status history

- 2026-11-10 → Clarified (leader: option 1, shape-aware skip, `--from`)
- 2026-11-10 → Planned (plan.md) — Approved by leader 2026-11-10 (0.33.1 item 5)
- 2026-11-10 → Tasked (tasks.md)
