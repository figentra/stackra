# Feature Specification: a ref: Cloudflare account id never reaches wrangler

**Feature Branch**: `figentra/sta-2124-cloudflare-ref-account`

**Created**: 2026-11-05

**Status**: Implementing — Approved by leader 2026-11-05

**Tier**: small

**Approver**: leader

**Linear**: STA-2124

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: Linear STA-2124: "runway: a ref: Cloudflare account id reaches wrangler unresolved, so Pay's dev surfaces
publish fails" (RUNWAY lane, verified 2026-11-05).

## Problem

Pay's `runway.yaml` declares `providers.cloudflare.accountId: ref:cloudflare.accountId`, a reference the job resolves:
the deploy workflow sets `CLOUDFLARE_ACCOUNT_ID` to the real id. Since `@stackra/cli` 0.9.0 the product deploy copies
the declared value verbatim into wrangler's environment, in two places:

- `packages/developer/cli/src/node/product/functions/run-deploy-product.function.ts` (`edgeKv`, the KV writer);
- `packages/developer/runway/src/node/functions/publish-product.function.ts` (the bundle uploads).

`runProgram` lays that override over `process.env`, so wrangler runs with `CLOUDFLARE_ACCOUNT_ID=ref:cloudflare.accountId`
and refuses it ("Invalid account ID"). Pay's Deploy (dev) failed at b8016e9 (run 42104238511); it passed at 0c06e1b on
`@stackra/cli` 0.3.0 (job 127511211635, "3 KV row(s), 0 upload(s)"). `console.pay.dev.figentra.com` answers 503
"Not released yet".

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/runway, packages/developer/cli
- **Public contract change**: additive: runway exports `cloudflareAccountEnv`
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none; the account id is not a secret, and nothing new is read or printed
- **Secrets**: none (`CLOUDFLARE_ACCOUNT_ID` is a job variable, read by name)
- **ADR needed**: no; it applies runway's existing `ref:` rule (as `prepare-env-read` and `onboard-mobile` do)
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free
- **UI surfaces**: none
- **Docs to update**: none
- **Lane**: bug
- **Change risk**: R1

## Requirements

### Functional Requirements

- **FR-001**: WHEN runway's `providers.cloudflare.accountId` is a literal id THE deploy SHALL run wrangler with
  `CLOUDFLARE_ACCOUNT_ID` set to that id, as today.
- **FR-002**: WHEN `providers.cloudflare.accountId` starts with `ref:` THE deploy SHALL NOT override
  `CLOUDFLARE_ACCOUNT_ID`; wrangler runs with the job's own value.
- **FR-003**: IF `providers.cloudflare.accountId` starts with `ref:` and the job's `CLOUDFLARE_ACCOUNT_ID` is unset or
  empty THEN THE deploy SHALL fail before any upload or KV write, with an error that names `CLOUDFLARE_ACCOUNT_ID` and
  the `ref:`.
- **FR-004**: THE KV writer (CLI `edgeKv`) and the bundle uploads (`publishProduct`) SHALL take this decision from one
  runway function, `cloudflareAccountEnv`.

## Acceptance criteria

- **AC-001**: WHEN the account id is a literal THE function SHALL return `{ CLOUDFLARE_ACCOUNT_ID: <id> }`.
- **AC-002**: WHEN the account id is a `ref:` and the environment has `CLOUDFLARE_ACCOUNT_ID` THE function SHALL return
  no override.
- **AC-003**: IF the id is a `ref:` and `CLOUDFLARE_ACCOUNT_ID` is unset THEN THE function SHALL throw
  `RunwayUnresolvedError` naming the variable.
- **AC-004**: WHEN no account id is declared THE function SHALL return no override, as today.
- **AC-005**: IF the account id is a `ref:` and the job lacks `CLOUDFLARE_ACCOUNT_ID` THEN THE publish step SHALL upload no
  bundle and write no KV row.

## Success Criteria

- **SC-001**: the runway and CLI unit tests for AC-001 to AC-004 pass in CI — verified by: unit
- **SC-002**: after a released `@stackra/cli` reaches Pay's catalog, Pay's Deploy (dev) job on main passes its Deploy
  step and its log shows the KV rows written, as at 0c06e1b ("3 KV row(s)") — verified by: manual (the RUNWAY lane
  reads the job). Pay's surfaces build currently produces no bundle, so `console.pay.dev.figentra.com` may still answer
  "Not released yet"; that is not this issue.

## Design

### Summary

One runway function decides the wrangler account override; both callers use it.

### Architecture overview

`cloudflareAccountEnv(accountId, env = process.env)` in runway's node layer; `publishProduct` and the CLI's `edgeKv`
call it instead of building `{ CLOUDFLARE_ACCOUNT_ID }` themselves.

### Components and responsibilities

runway owns the `ref:` rule; the CLI only passes the result to the KV driver.

### Files and folders

`packages/developer/runway/src/node/functions/cloudflare-account-env.function.ts` (new) and its test; the two callers;
runway's node index exports it.

### Data models and migrations

None.

### Contracts

Additive export; no change to `runway.yaml` or the deploy workflow.

### Error handling

`RunwayUnresolvedError` (the error `prepare-env-read` uses for an unresolved `ref:`), thrown before any write.

### Security and tenancy

None: the id is not secret; no value is printed.

### Testing strategy

Unit: the function's four cases; `publishProduct` with a `ref:` passes no env (set) and uploads nothing (unset).

### Rollout

Changesets patch for `@stackra/runway` and `@stackra/cli`; release (owner approves the core release run); Pay bumps its
catalog; RUNWAY verifies Pay's dev deploy.

## Tasks

- [ ] T001 `cloudflareAccountEnv` and its tests in `packages/developer/runway/src/node/functions/` — covers: FR-001, FR-002, FR-003, AC-001, AC-002, AC-003, AC-004
- [ ] T002 `publishProduct` and the CLI's `edgeKv` use it, with `ref:` cases in `publish-product.function.test.ts` — covers: FR-004, AC-005
- [ ] T003 Changesets for `@stackra/runway` and `@stackra/cli` (patch) — covers: SC-002, AC-001

## Out of scope

- Resolving `ref:` values from Pulumi stack config inside the CLI (the job already resolves this one).
- The staging and preview environment variables Pay's deploy lacks (infra/owner work, READINESS D5).

## Assumptions

- Every product job that declares a `ref:` account id sets `CLOUDFLARE_ACCOUNT_ID` (Pay's deploy.yml does).

## Amendments

- A-001 · 2026-11-05 · leader's revision before approval: SC-002 reads the KV rows, not the page; AC-003's upload half split out as AC-005 (spec gate: one EARS clause each)
- A-002 · 2026-11-05 · review (RUNWAY note, Flow review finding 3): FR-003 does not apply to a dry run, which uploads and writes nothing; `deployProduct` passes `dryRun` to `publishProduct`, which then skips the check

## Status history

- 2026-11-05 · — → Draft · Flow lane (Claude) · created from STA-2124
- 2026-11-05 · Draft → Implementing · leader · Approved by leader 2026-11-05, after revising SC-002 (KV rows, not the page)
