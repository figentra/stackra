# Feature Specification: Secret-manager agent and the secrets inbox

**Feature Branch**: `figentra/sta-185-secret-manager-inbox`

**Created**: 2026-10-20

**Status**: Done

**Linear**: STA-185

**Linear project**: none

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: User description: "A secret-manager agent writes secret values the owner drops into ~/Secrets-inbox/ into Infisical for every environment without anyone seeing them: one audited script, dry run, production on the owner's yes, names-only audit, hooks keep every agent out of the inbox."

## Impact

- **Apps touched**: `apps/docs` (runbook `runbooks/secrets`, ADR 0257, ADR 0009 note, ADR index, navigation)
- **Services touched**: none
- **Packages touched**: none
- **Public contract change**: new root script `pnpm secrets:import`; `importSecret()` exported from `tools/scripts/secrets-import.mjs`
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: writes secret values; never outputs one (ADR 0257); hooks are an accident guard
- **Secrets**: writes any Infisical secret the owner drops; reads none into output
- **ADR needed**: yes, ADR 0257 (Proposed), amending ADR 0009 rule 3
- **New dependencies**: none (`yaml` is already a root devDependency)
- **Deploy modes**: none (developer-machine tooling)
- **Licence tier**: free (MIT)
- **UI surfaces**: none
- **Docs to update**: `apps/docs/src/docs/runbooks/secrets.mdx`, `apps/docs/src/docs/adr/0257-secret-manager-agent-and-the-secrets-inbox.mdx`
- **Lane**: lite (recorded reason: tooling script plus agent and hook config, written after the build at the coordinator's direction)
- **Change risk**: R2 (secret handling; security review required, ADR 0120 D16)

## User Scenarios & Testing

### User Story 1 - Hand over a secret without pasting it (Priority: P1)

The owner drops `NAME[.ext]` into `~/Secrets-inbox/`; the secret-manager agent runs `pnpm secrets:import` and
reports names and results only.

**Independent Test**: the import tests run against a temporary HOME and a fake Infisical and assert a random canary
value never reaches output, the audit log or argv.

**Acceptance Scenarios**:

1. **Given** a valid inbox file, **When** the import runs, **Then** the value is stored, verified by hash, and the file deleted.
2. **Given** a production target, **When** the import runs without a dry-run token, **Then** it refuses.

### User Story 2 - Agents stay out of the inbox (Priority: P2)

**Independent Test**: hook tests feed the guards inbox paths, globs and home-wide searches.

**Acceptance Scenarios**:

1. **Given** `cat ~/Secrets-inbox/X` or a Read of an inbox file, **When** an agent tries it, **Then** the hook denies it.

### Edge Cases

- **EC-01**: A crash after a production token is spent leaves the token unusable and the inbox file in place.

## Requirements

- **FR-001**: WHEN a valid file is in the inbox THE importer SHALL write it to the target Infisical env and path, verify by SHA-256 read-back, then delete the file, AND SHALL keep the file and report a value-free reason on any failure.
- **FR-002**: THE importer SHALL never print, log or pass on argv a secret value.
- **FR-003**: WHEN `--dry-run` runs THE importer SHALL validate without writing, AND a production write SHALL require a one-time token from a dry run.
- **FR-004**: THE hooks SHALL deny shell commands and Read, Grep, Glob, Write and Edit that reach the inbox.
- **FR-005**: THE import core SHALL be callable as `importSecret({ name, env, path, valueStream, actor })` returning only `{ name, ok, reason }`.

## Success Criteria

- **SC-001**: The first real import after merge stores the three reviewer-app secrets and deletes the inbox files — verified by: manual

## Out of scope

- Runtime-store (Encore) secrets; the local request page (STA-187).

## Assumptions

- The Infisical CLI 0.44.2 pinned in `mise.toml` supports `NAME=@file` (its `secrets set --help` documents it).

## Status history

- 2026-10-20 · — → Draft · Claude (builder) · written after the build at the coordinator's direction (lite lane)
- 2026-10-20 · Draft → Clarified · Claude (builder) · scope from the owner decision on STA-185
- 2026-10-20 · Clarified → Planned · Claude (builder)
- 2026-10-20 · Planned → Tasked · Claude (builder)
- 2026-10-20 · Tasked → Implementing · Claude (builder)
- 2026-10-20 · Implementing → Done · Claude (builder) · implementation landed before the spec; tests carry the `@covers` tags
