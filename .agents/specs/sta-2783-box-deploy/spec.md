# Feature Specification: the box deploys Encore staging and Stackra's own Workers, built OFF

**Feature Branch**: `figentra/sta-2783-box-deploy`

**Created**: 2026-11-26

**Status**: Draft

**Tier**: small

**Approver**: leader

**Linear**: STA-2783 (with STA-2784)

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: the owner's recorded exception of 2026-11-25 while figentra's GitHub Actions is billing-locked: box 1 deploys
Encore staging and Stackra's own Workers (STA-2783), only in the Stackra Cloudflare account (STA-2784), with automatic
promotion behind mandatory gates (ADR 0536, "All automatic"). The CTO's read of the pull request (2026-11-26) added the
requirements FR-007 to FR-012 before either switch goes on. The code is complete and built OFF; the leader's approval
moves this spec to Implementing.

### Sources

- `tools/scripts/stackra-deploy.mjs` (its header is the runbook), `tools/scripts/worker-smoke.mjs`,
  `tools/scripts/d1-migration-gate.mjs`
- ADR 0536 (this pull request), ADR 0468, ADR 0170, ADR 0352, ADR 0440, ADR 0519, ADR 0525
- `.github/workflows/runway-cloudflare-workers.yml` (the steps the box reproduces)
- STA-2783, STA-2784, STA-2786; the CTO's read of the pull request, 2026-11-26

## Impact

- **Apps touched**: apps/docs (a Worker script answering `/-/version` for the deploy smoke's proof)
- **Services touched**: none
- **Packages touched**: none; workers/edge names the answering version in `x-stackra-version`
- **Tools touched**: tools/scripts (stackra-deploy.mjs, worker-smoke.mjs, d1-migration-gate.mjs and their tests)
- **Public contract change**: none
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: secrets are read only at the moment they are needed, scrubbed from every output, never in
  argv or the ledger; the production-capable Encore credential is held by its own user, out of reach of tree code
- **Secrets**: the Cloudflare token, the Encore OAuth client and an optional GitHub token, from 0400 files or Infisical
  at run time (the owner chooses); names only in code
- **ADR needed**: ADR 0536 (this pull request)
- **New dependencies**: none
- **Deploy modes**: box 1 only, built OFF
- **Licence tier**: free
- **UI surfaces**: none
- **Docs to update**: apps/docs/src/docs/adr/0536-box-deploys-promote-automatically-behind-mandatory-gates.mdx,
  tools/scripts/README.md
- **Lane**: lite
- **Change risk**: R3 (deploy path; built OFF)

## Requirements

### Functional Requirements

- **FR-001**: THE service SHALL deploy nothing while its path's switch is not exactly `on`.
- **FR-002**: THE service SHALL deploy only a commit of origin/main with a green `stackra/verify` from the verify App at
  that SHA (a box-green record stands in only under its switch, written by its owner).
- **FR-003**: THE Encore path SHALL refuse any app or environment but `stackra-nzk2` staging before any API call.
- **FR-004**: THE Workers path SHALL deploy only docs and edge, in the Stackra account, on Stackra's own domain.
- **FR-005**: WHEN a pending D1 statement is not additive, or inserts into a table that grants rights, THE deploy SHALL
  stop for the owner before anything is applied or uploaded.
- **FR-006**: THE new version SHALL take no traffic before its 0% smoke proves it answered, then promote 10%, 50%, 100%
  with the smoke at each step and roll back on any failure.
- **FR-007**: WHEN the last attempt at main's head ended in failure, needs-owner or refused THE timer SHALL NOT run that
  target at that SHA again; a new head or a run by hand clears it.
- **FR-008**: THE service SHALL run only from a service clone pinned by `service update` to a main SHA that passed the
  verify gate, as a fast-forward, and whose code no other user can change.
- **FR-009**: THE Encore path SHALL run as its own user, with its credential in its own folder; THE Workers path SHALL
  refuse to run while it can reach that folder or names an Encore setting.
- **FR-010**: WHERE `STACKRA_DEPLOY_SECRETS=infisical` THE service SHALL fetch each secret into memory with the path
  user's own machine identity, and SHALL read 0400 files otherwise.
- **FR-011**: THE service SHALL call GitHub, Encore and Infisical only at origins fixed in code.
- **FR-012**: THE service SHALL write no secret into argv, a log, the ledger or a child's environment beyond wrangler's.

## Acceptance criteria

- **AC-001**: IF a path's switch is not exactly `on` THEN THE deploy SHALL refuse before any command runs.
- **AC-002**: IF the SHA is not on origin/main or has no green `stackra/verify` from the verify App THEN THE deploy
  SHALL refuse before anything is built.
- **AC-003**: IF an Encore deploy names any environment but staging THEN THE client SHALL refuse before any request,
  the token mint included.
- **AC-004**: IF a Worker's config names the main account, no account or a host off Stackra's domain THEN THE deploy
  SHALL refuse.
- **AC-005**: IF a pending D1 statement drops, updates, deletes or inserts into a rights-granting table THEN THE deploy
  SHALL end in needs-owner with nothing applied or uploaded.
- **AC-006**: WHEN the 0% smoke cannot prove the new version answered THE deploy SHALL roll back before any traffic
  moves.
- **AC-007**: WHEN a smoke fails at 10%, 50%, 100% or live THE deploy SHALL put the old version back at 100%.
- **AC-008**: WHEN the newest attempt at main's head failed, needed the owner or was refused THE timer SHALL plan no
  run for it and write one `held` ledger line.
- **AC-009**: IF the service clone is not at a commit `service update` pinned, or another user can change its code,
  THEN THE preflight SHALL refuse.
- **AC-010**: WHEN main's head has no green verify or is not a fast-forward THE `service update` SHALL leave the clone
  at its pinned commit.
- **AC-011**: IF the Workers path's user can reach the Encore folder or names an Encore setting THEN THE preflight
  SHALL refuse; IF the Encore path names a Workers setting or can act as the build user THEN its preflight SHALL
  refuse.
- **AC-012**: WHERE secrets come from Infisical THE service SHALL read each value from its own path's folder only and
  write it nowhere.
- **AC-013**: THE settings SHALL NOT change the GitHub or Encore API origins.
- **AC-014**: THE argv, logs, ledger and every child environment but wrangler's SHALL hold no secret value.

## Success Criteria

- **SC-001**: the scripts' tests pass in `pnpm validate` — verified by: unit
- **SC-002**: the go-live list in the runbook is recorded in the ledger before a switch goes on — verified by: manual

## Design

### Summary

One Node script, run by systemd timers on box 1 as one user per path, reproduces CI's Worker deploy with mandatory
gates, and triggers Encore staging rollouts; a JSONL ledger records every attempt.

### Files and folders

```text
tools/scripts/
  stackra-deploy.mjs
  d1-migration-gate.mjs
  worker-smoke.mjs
  __tests__/
apps/docs/
  worker/main.ts
  wrangler.jsonc
  tsconfig.json
workers/edge/
  src/http/with-version.ts
  src/main.ts
  wrangler.jsonc
apps/docs/src/docs/adr/
  0536-box-deploys-promote-automatically-behind-mandatory-gates.mdx
```

### Security and tenancy

Secrets are read at the moment of use (0400 files, or Infisical by the path user's own machine identity), scrubbed from
every output; the Encore credential has its own user and folder; the service code is pinned to a verified SHA.

### Testing strategy

A fake box (`tools/scripts/__tests__/__fixtures__/`) answers git, sudo, wrangler, GitHub, Encore and Infisical; every
gate and the no-leak rule have a test.

### Rollout

Built OFF. The owner chooses the secrets model and provisions the identities or files; the go-live list is verified
on the first watched deploy; then each switch is set to `on`.

## Tasks

- [x] T001 `tools/scripts/stackra-deploy.mjs`: the service — covers: FR-001, FR-002, FR-003, FR-004, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, AC-001, AC-002, AC-003, AC-004, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014
- [x] T002 `tools/scripts/d1-migration-gate.mjs`: the additive-only gate with trust tables — covers: FR-005, AC-005
- [x] T003 `tools/scripts/worker-smoke.mjs`: the smoke suites with the version proof — covers: FR-006, AC-006, AC-007
- [x] T004 `tools/scripts/__tests__/stackra-deploy.test.mjs`, `tools/scripts/__tests__/d1-migration-gate.test.mjs`,
      `tools/scripts/__tests__/worker-smoke.test.mjs` and `tools/scripts/__tests__/__fixtures__/`: the fake box and
      the tests — covers: AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011,
      AC-012, AC-013, AC-014
- [x] T005 `apps/docs/worker/main.ts`, `apps/docs/wrangler.jsonc`, `apps/docs/tsconfig.json`,
      `apps/docs/vitest.config.ts`, `apps/docs/AGENTS.md`: the docs Worker's `/-/version` — covers: FR-006, AC-006
- [x] T006 `workers/edge/src/http/with-version.ts`, `workers/edge/src/main.ts`, `workers/edge/wrangler.jsonc`,
      `workers/edge/src/interfaces/edge-env.interface.ts`: edge's `x-stackra-version` — covers: FR-006, AC-006
- [x] T007 `apps/docs/src/docs/adr/0536-box-deploys-promote-automatically-behind-mandatory-gates.mdx`,
      `apps/docs/adr/numbers.yaml`, the ADR index, 0468's note, `tools/scripts/README.md`: the decision and its index — covers:
      SC-002, AC-001

## Status history

- 2026-11-26 · — → Draft · box deploy lane (Claude) · created from STA-2783 so the pull request's feat commits have a
  lane; the leader's approval moves it to Implementing
