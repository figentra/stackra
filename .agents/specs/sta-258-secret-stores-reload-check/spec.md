# Feature Specification: Google and file secret stores, reload on rotation, and the names check before a deploy

**Feature Branch**: `figentra/sta-258-secret-stores-reload-check`

**Created**: 2026-11-27

**Status**: Implementing

**Tier**: feature

**Approver**: leader (technical stop under the owner's delegation; change risk R3, so the security reviewer reads it too)

**Linear**: STA-258

**Linear project**: Codegen

**Clarifications status**: complete

**Analyze**: —

**Input**: Readiness batch 15, item 15.5. AWS Secrets Manager is the only loading `SecretStore` driver, it reads once at
boot, and nothing checks before a deploy that the environment holds each secret the deploy syncs: in the field report
61 secrets were created by hand (19 empty) before Encore would provision. STA-258 asks for a names-only check against
each environment's set, with empty placeholders allowed so provisioning does not fail.

## Impact

- **Apps touched**: apps/docs (ADR 0371 amendment, the `runway env missing` page, the secrets and runway runbooks, the docs nav)
- **Services touched**: none
- **Packages touched**: packages/foundation/config (two drivers, two configs, `scheduleSecretReload`, the barrels, the manifest), packages/developer/runway (`runway env missing`, the same check inside `runway secrets decrypt` for a product scope, optional names in the plan, placeholders in the sync only where Encore holds no value), `.github/actions/secrets-decrypt` (header only)
- **Public contract change**: additive: `GcpSecretManagerSecretStoreDriver` and `FileSecretStoreDriver` from `@stackra/config/node`; `GcpSecretManagerConfig`, `GcpSecretManagerConfig$`, `GcpSecretManagerOptions`, `SecretFilesConfig`, `SecretFilesConfig$`, `SecretFilesOptions`, `scheduleSecretReload` and the types `LoadableSecretStore`, `SecretReload`, `SecretReloadOptions` from `@stackra/config`; driver names `gcp_secret_manager` and `file` (`config.SecretStore`); config keys `config.gcp_secret_manager` and `config.secret_files`; `@stackra/runway`'s `runway env missing` command, `SecretSyncEntry.placeholders`, the `optional` flag on a plan's secret sync entry and `required` on a member's env rows; `runway secrets decrypt` exits 1 before decrypting a product scope of the checked-out repository that lacks a required secret. No existing member changes its signature or default. `SecretsConfig` gains no reload interval field: nothing at boot would read it until STA-2804.
- **Cross-service events**: none
- **Tenancy and data**: none (no table, no tenant data; secrets are deployment-wide)
- **Security and privacy**: values are read only in a store's `load()`, kept in a private map and never listed, logged or put in an error; the Google driver never quotes a response body (a parse error could) and uses the runtime's own service-account token, never a key; the `file` driver accepts SCREAMING_SNAKE names only, so a configured name cannot leave its folder; the names check reads ciphertext file names and decrypts nothing
- **Secrets**: none added; names only (`required: false` rows become placeholders)
- **ADR needed**: no new ADR: an amendment of ADR 0371 (decision 2 rows, decision 4, open question 2)
- **New dependencies**: none (the Google driver uses `fetch`; the `file` driver `node:fs`)
- **Deploy modes**: SaaS binds `env`, `aws_secrets_manager` or `gcp_secret_manager`; on-premises and air-gapped may bind `file`, which makes no outbound call
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: apps/docs/src/docs/adr/0371-secret-store-drivers-which-deploy-mode-binds-which-and-how-the-bootstrap-credential-arrives.mdx, apps/docs/src/docs/runway/env-missing.mdx, apps/docs/src/docs/runbooks/secrets.mdx, apps/docs/src/docs/runbooks/runway.mdx, apps/docs/src/config/docs.config.ts, packages/foundation/config/README.md, packages/foundation/config/AGENTS.md, packages/developer/runway/README.md
- **Lane**: full
- **Change risk**: R3 (secrets: new stores and the deploy-time secret sync)

## Discovery

- **Current behaviour**: `@stackra/config` ships `memory` and `aws_secrets_manager`; the AWS driver reads its ids once in
  `load()`, and nothing calls `load()` again. `runway secrets sync` reads every synced name from the job's environment
  after the decrypt and throws when one is absent or empty, optional ones included; `runway env check` checks names
  against code only, and `runway env orphans` reports names in the scope nothing declares, not the reverse (SRC-001,
  SRC-002).
- **Topology**: drivers in `packages/foundation/config/src/node/drivers/`, names in `SECRET_STORE_DRIVERS`, configs in
  `src/config/` over schemas in `src/core/schemas/` and `src/core/constants/`; the runway plan in
  `deploy-plan.function.ts`, the sync plan in `secret-sync-plan.function.ts`, the reader in
  `read-member-secrets.function.ts`, the CI reads in `prepare-env-read.function.ts` (SRC-001, SRC-002).
- **Dependencies**: Google Cloud's metadata server and Secret Manager REST API (v1, global and regional endpoints); the
  ciphertext layout `<dir>/<scope>/<NAME>.enc.yaml` the secrets-decrypt action downloads (SRC-003).
- **Ownership**: `@stackra/config` and `@stackra/runway` by the core maintainers; ADR 0371 by the leader (SRC-004).
- **Constraints already decided**: ADR 0173 and ADR 0525 (secrets by name; values only in `figentra/secrets` and the
  stores runway syncs to); ADR 0371 (one store per process; load at boot, fail closed; residency); ADR 0294 (drivers
  named by file; a package ships its own `X$`); STA-2804 (binding the configured store in `bootApp` and its reload policy
  wait for a CTO ruling) (SRC-004, SRC-005).

### Sources

- **SRC-001**: `packages/foundation/config/src/node/drivers/aws-secrets-manager-secret-store.driver.ts`, `src/core/constants/secret-store-drivers.constant.ts` and `src/core/schemas/secrets-options.schema.ts` on `origin/main` (FR-001 to FR-006)
- **SRC-002**: `packages/developer/runway/src/node/functions/{deploy-plan,secret-sync-plan,read-member-secrets,sync-secrets,env-orphans,prepare-env-read}.function.ts` on `origin/main` (FR-007 to FR-011)
- **SRC-003**: `.github/actions/secrets-decrypt/action.yml` and `packages/developer/runway/src/node/functions/decrypt-scope.function.ts` on `origin/main` (FR-008, FR-012)
- **SRC-004**: ADR 0371 (with its 2026-11-07 amendment), ADR 0173, ADR 0525, ADR 0294 in `apps/docs/src/docs/adr/` (FR-001 to FR-012)
- **SRC-005**: STA-258 (this work), STA-2804 (the boot binding and its reload policy), the readiness report item 15.5 (FR-005, FR-006)
- **SRC-007**: the independent review of the branch (two medium findings: a slow provider could stop reloads for good; the boot wiring is STA-2804), and `@smithy/node-http-handler` 4.12.1, whose `requestTimeout` and `socketTimeout` default to no limit (FR-016 to FR-018)
- **SRC-006**: the independent review of PR stackra-inc/stackra#1192 (its three low follow-ups) and `packages/foundation/config/src/core/functions/layer-config.function.ts` on the branch, which takes an empty environment value as set (FR-013 to FR-015)

## Glossary

- **Loading store**: a `SecretStore` driver that reads its values in `load()` and answers `get` from that copy.
- **Placeholder**: a synced secret only code declares, `required: false` everywhere and on no `config` row; the
  environment may lack it and the sync writes it empty.
- **Default**: a synced name only code declares, `required: false` everywhere, that a `config` row declares; the
  environment may lack it and the sync leaves it unset, so its config default applies.
- **Synced names**: what `deployPlan(env).sync` lists as secrets: member runway `secrets`, the manifest's `secret` and
  `config` rows for that environment, and the generated gateway's.

## User Scenarios & Testing

### User Story 1 - A deploy names a missing secret before it touches anything (Priority: P1)

A deploy job downloads the environment's ciphertext and runs `runway secrets decrypt`, which first runs the names check
for every environment of a product scope of the checked-out repository (`runway env missing <env>` runs it on its own). A
required name the scope lacks fails the job with the name and member; nothing is decrypted or deployed.

**Why this priority**: the field report's 61 hand-made secrets; the deploy failed only once Encore provisioned.

**Independent Test**: `env-missing.function.test.ts`, `runway-env-missing.command.test.ts`, `scope-missing.function.test.ts` and `runway-secrets-decrypt.command.test.ts`.

**Acceptance Scenarios**:

1. **Given** a scope lacking a required synced name, **When** the check runs, **Then** it exits 1 naming it.
2. **Given** a scope lacking only an optional name, **When** the check runs, **Then** it warns and exits 0, and the sync writes the name empty only where Encore holds no value for it.
3. **Given** an optional name the scope lacks and a value set by hand in Encore, **When** the sync runs, **Then** it issues no `encore secret set` for it.

### User Story 2 - A rotated secret reaches a running process (Priority: P2)

A host binds a loading store and schedules its reload; after a rotation, code that reads the store by name sees the new
value without a restart, and a failed reload keeps the last good one.

**Why this priority**: rotation without a redeploy; the boot binding itself is STA-2804.

**Independent Test**: `schedule-secret-reload.function.test.ts` and the Kubernetes swap case in `file-secret-store.driver.test.ts`.

**Acceptance Scenarios**:

1. **Given** a loaded store and a rotated value, **When** the interval passes or `reloadNow()` runs, **Then** `get` answers the new value.
2. **Given** a reload that fails, **When** `get` is called, **Then** it answers the last good value and `onError` was told.

### User Story 3 - Google Cloud and on-premises runtimes read their own store (Priority: P2)

A runtime on Google Cloud compute reads Secret Manager with its own identity, in its region; an on-premises install
reads the secrets its platform mounts as files.

**Independent Test**: `gcp-secret-manager-secret-store.driver.test.ts` and `file-secret-store.driver.test.ts`.

**Acceptance Scenarios**:

1. **Given** `project`, `location` and ids, **When** the Google store loads, **Then** it reads each version through the regional endpoint with the metadata token.
2. **Given** a mounted folder, **When** the `file` store loads, **Then** it reads each SCREAMING_SNAKE file and skips the platform's own entries.

### Edge Cases

- **EC-01**: the metadata server is unreachable (not on Google Cloud): the load fails naming it, no value.
- **EC-02**: a Secret Manager answer is not JSON: the id fails as "unreadable answer"; the body is never quoted.
- **EC-03**: a name is declared optional in one manifest row and required in another, or listed in a runway: it is required.
- **EC-04**: two reloads overlap: the second joins the first, until the first passes its deadline.
- **EC-05**: a provider connection drops halfway: the AWS request times out and throws; if a `load()` still hangs, the reload deadline reports it and the next tick tries again.

## Requirements

### Functional Requirements

- **FR-001** (example-only): THE `SecretStore` port SHALL have a `gcp_secret_manager` driver that reads each configured id's `latest` or pinned version with the metadata server's token, eight at a time, through the location's regional endpoint when `location` is set. Sources: SRC-004
- **FR-002** (example-only): THE `SecretStore` port SHALL have a `file` driver that reads one file per secret from an absolute folder, every SCREAMING_SNAKE regular file or only `names`, dropping one trailing line break and refusing a file over 64 KiB. Sources: SRC-004
- **FR-003**: WHEN a loading driver's read fails THE driver SHALL reject naming steps, ids and statuses only, and SHALL keep the copy of its last good load. Sources: SRC-001
- **FR-004** (example-only): THE AWS and Google drivers SHALL split a JSON-object secret into its string members with one shared function. Sources: SRC-001
- **FR-005**: `scheduleSecretReload` SHALL reload a loading store every `everySeconds` (0: none) and on `reloadNow()`, one reload at a time, with an unref'd timer, and report a failed reload to `onError`. Sources: SRC-005
- **FR-006** (example-only): `SecretsConfig` SHALL accept `gcp_secret_manager` and `file` as `store`, and SHALL NOT carry a reload interval until boot reads one (STA-2804). Sources: SRC-001, SRC-005
- **FR-007**: `deployPlan` SHALL mark a synced secret `optional` only when code alone declares it and every declaration is `required: false`. Sources: SRC-002
- **FR-008**: `runway env missing <env>` SHALL error on each required synced name the scope's ciphertext lacks and warn on an optional one, reading file names only, in a proved CI job. Sources: SRC-002, SRC-003
- **FR-009**: `secretSyncPlan` SHALL list a member's optional names as `placeholders`. Sources: SRC-002
- **FR-010**: `readMemberSecrets` SHALL read an absent or empty placeholder as an empty string and still fail on a required one. Sources: SRC-002
- **FR-011**: `runway secrets sync` SHALL write a placeholder the scope lacks into Encore as an empty value only when `encore secret list` shows Encore holds no value for it in the environment, SHALL keep a value Encore holds, SHALL write no placeholder when the listing cannot be read, and SHALL say so by name. Sources: SRC-002
- **FR-012**: `runway secrets decrypt` SHALL, for a product scope of the checked-out repository, run the names check for every runway environment of that scope before it decrypts anything, and exit 1 naming each required secret the scope lacks; it SHALL check nothing for any other scope. Sources: SRC-003
- **FR-013**: `deployPlan` SHALL mark an optional name a `config` row declares `optional: "default"` and every other optional name `optional: "placeholder"`; `secretSyncPlan` SHALL list the first as `defaults`; `readMemberSecrets` SHALL leave a default out when the scope lacks it or holds it empty; `runway secrets sync` SHALL never write a default the scope lacks, and SHALL say so by name. Sources: SRC-002
- **FR-014**: `reloadNow()` SHALL never reject: an `onReload` error SHALL go to `onError`, and an `onError` error SHALL be dropped. Sources: SRC-005
- **FR-016**: EACH reload under `scheduleSecretReload` SHALL have a deadline (`timeoutMs`, 1 to 600,000 ms, default 30,000); WHEN `load()` has not settled by it THE reload SHALL tell `onError` it timed out, answer `false` and release the schedule, so the next tick or `reloadNow()` calls `load()` again; a late failure of the abandoned load SHALL NOT be reported again. Sources: SRC-007
- **FR-017**: THE AWS driver SHALL build its client with a 3 s connection timeout, a request timeout of `timeoutMs` (100 to 60,000 ms, default 10,000) that throws, and at most three attempts. Sources: SRC-007
- **FR-018**: THE `file` driver SHALL open each file non-blocking, so a FIFO named like a secret is skipped (listed) or refused (named) without waiting for a writer. Sources: SRC-007
- **FR-015**: THE `file` driver SHALL open each file once and check its kind and size on that handle and on the bytes it reads, so a file swapped or grown after the check is refused, never read unchecked. Sources: SRC-004

### Non-functional Requirements

- **NFR-001**: no value, token or response body reaches a log line, an error or an argument. Sources: SRC-004
- **NFR-002**: every Google and AWS request carries a timeout (`timeoutMs`, 100 to 60,000 ms, default 10,000), and every reload a deadline (FR-016). Sources: SRC-004, SRC-007

### Key Entities

- **Placeholder**: a name in `SecretSyncEntry.placeholders`.
- **Default**: a name in `SecretSyncEntry.defaults`.
- **Loading store**: `LoadableSecretStore` (`SecretStore` with `load()`).

## Acceptance criteria

- **AC-001**: WHEN the scope lacks a required synced name THE `runway env missing` run SHALL exit 1 naming it and its member.
- **AC-002**: WHEN the scope lacks only optional names THE run SHALL exit 0 with a warning per name, and the sync SHALL write each empty only where Encore holds no value for it.
- **AC-007**: WHEN a product scope lacks a required synced name THE `runway secrets decrypt` run SHALL exit 1 with nothing decrypted.
- **AC-008**: WHEN a loaded secret is a JSON object THE AWS and Google stores SHALL answer one secret per string member.
- **AC-009**: WHEN only code declares a name and every declaration is `required: false` THE plan SHALL mark it optional and the sync entry SHALL list it as a placeholder.
- **AC-010**: THE shipped `SecretsConfig$` SHALL hold `store` only.
- **AC-003**: WHEN a loading store reloads after a rotation THE store SHALL answer the new value; WHEN the reload fails THE store SHALL answer the old one.
- **AC-004**: THE Google driver SHALL read through the regional endpoint with the metadata token and fail closed without one.
- **AC-005**: THE `file` driver SHALL follow a Kubernetes Secret volume's atomic swap on reload.
- **AC-011**: WHEN the scope lacks an optional config name THE check SHALL warn that its default applies, and the sync SHALL write nothing for it.
- **AC-012**: WHEN `onReload` or `onError` throws THE `reloadNow()` promise SHALL resolve, and the interval SHALL leave no unhandled rejection.
- **AC-013**: WHEN a secret file grows past 64 KiB after the driver first looked at it THE load SHALL fail naming it, with the last good copy kept.
- **AC-014**: WHEN a store's `load()` never settles THE reload SHALL answer `false` at its deadline with `onError` told, and THE next `reloadNow()` SHALL call `load()` again.
- **AC-015**: WHEN a listed folder holds a FIFO named like a secret THE `file` load SHALL finish without it.
- **AC-016**: WHEN the AWS store builds its client THE client SHALL carry a 3 s connection timeout, a request timeout of `timeoutMs` that throws, and at most three attempts.
- **AC-006**: THE committed manifest SHALL list `memory`, `aws_secrets_manager`, `gcp_secret_manager` and `file` as `config.SecretStore` candidates.

## Success Criteria

- **SC-001**: every new behaviour has a unit test that fails without it; `@stackra/config` coverage stays above the shared gate — verified by: unit
- **SC-002**: on a real Linux file system the `file` driver follows the kubelet's `..data` swap — verified by: unit (`file-secret-store.driver.test.ts` on box 2)

## Out of scope

- Binding the configured store in `bootApp` and scheduling its reload there (STA-2804, waits for the CTO's reload-policy ruling).
- Re-resolving a `@Secret` configuration field after boot (configurations are validated and frozen, ADR 0146).
- Bumping the template's pinned secrets-decrypt action (it pins a core commit; it follows the release that carries this check).

## Assumptions

- A Google runtime runs where the metadata server issues its service-account token (Cloud Run, GKE Workload Identity, Compute Engine).
- `encore secret set` accepts an empty value on stdin, as the field report's 19 empty secrets show.

## Amendments

- 2026-11-27 · review: the sync no longer empties a value set by hand in Encore (FR-011); the names check runs inside
  `runway secrets decrypt` for every product deploy instead of behind the opt-in `check-environment` input, which is
  removed (FR-012, AC-007); `SecretsConfig.reloadSeconds` is removed because nothing reads it until STA-2804 binds the
  store at boot (FR-006). STA-258 stays open for that runtime half.
- 2026-11-27 · review follow-ups: an optional config name is never written empty, so its default applies (FR-013,
  AC-011); a listener that throws never rejects `reloadNow()` (FR-014, AC-012); the `file` driver checks each file on
  one handle and on the bytes read (FR-015, AC-013).
- 2026-11-27 · second review: every reload has a deadline and a timed-out reload releases the schedule (FR-016, AC-014);
  the AWS client has connection and request timeouts and three attempts (FR-017); the `file` driver opens
  non-blocking (FR-018, AC-015). The boot wiring stays STA-2804 (blocking STA-258's runtime half), and the changeset,
  README and ADR now call `scheduleSecretReload` an opt-in helper and say a `@Secret` field changes only on restart.

## Status history

- 2026-11-27 · — → Draft · spec author · written from the readiness item 15.5 and STA-258
- 2026-11-27 · Draft → Clarified · spec author · questions answered from ADR 0371, STA-258 and STA-2804
- 2026-11-27 → Planned (plan.md)
- 2026-11-27 → Tasked (tasks.md)
- 2026-11-27 → Implementing (built on the branch, tasks ticked)
- 2026-11-27 → Implementing (review findings addressed: T016 to T018)
- 2026-11-27 → Implementing (review follow-ups addressed: T019 to T021)
- 2026-11-27 → Implementing (second review addressed: T022 to T024)
