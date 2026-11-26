# Feature Specification: the box deploys Encore staging and Stackra's own Workers, built OFF

**Feature Branch**: `figentra/sta-2783-box-deploy`

**Created**: 2026-11-26

**Status**: Implementing (leader's approval pending)

**Tier**: small

**Approver**: leader

**Linear**: STA-2783 (with STA-2784)

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: the owner's recorded exception of 2026-11-25 while figentra's GitHub Actions is billing-locked: box 1 deploys
Encore staging and Stackra's own Workers (STA-2783), only in the Stackra Cloudflare account (STA-2784), with automatic
promotion behind mandatory gates (ADR 0536, "All automatic"). The CTO's read of the pull request (2026-11-26) added the
requirements FR-007 to FR-012 before either switch goes on.

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

## Tasks

- [x] T001 tools/scripts/stackra-deploy.mjs: the service (FR-001 to FR-012)
- [x] T002 tools/scripts/d1-migration-gate.mjs: the additive-only gate with trust tables (FR-005)
- [x] T003 tools/scripts/worker-smoke.mjs: the smoke suites with the version proof (FR-006)
- [x] T004 tools/scripts/**tests**/stackra-deploy.test.mjs, d1-migration-gate.test.mjs, worker-smoke.test.mjs and
      tools/scripts/**tests**/**fixtures**/: the fake box and the tests
- [x] T005 apps/docs/worker/main.ts, apps/docs/wrangler.jsonc, apps/docs/tsconfig.json, apps/docs/vitest.config.ts,
      apps/docs/AGENTS.md: the docs Worker's `/-/version`
- [x] T006 workers/edge/src/http/with-version.ts, workers/edge/src/main.ts, workers/edge/wrangler.jsonc,
      workers/edge/src/interfaces/edge-env.interface.ts: edge's `x-stackra-version`
- [x] T007 apps/docs/src/docs/adr/0536-box-deploys-promote-automatically-behind-mandatory-gates.mdx, apps/docs/adr/
      numbers.yaml, the ADR index, 0468's note, tools/scripts/README.md: the decision and its index
