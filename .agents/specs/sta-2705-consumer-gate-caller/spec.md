# Feature Specification: the consumer gate runs: the scaffold consumer, dated pins and a caller workflow

**Feature Branch**: `figentra/sta-2705-consumer-gate-caller`

**Created**: 2026-11-26

**Status**: Planned

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation; CI policy, R2)

**Linear**: STA-2705

**Clarifications status**: complete

**Input**: The owner decided on 20 Nov 2026 (STA-2705, "go") to make the consumer gate a release blocker. The
readiness audit of 26 Nov (batch 7, item 7.1) found that `stackra consumer-gate` (STA-1813) is built but nothing calls
it, its pins date from 2026-11-01, and its `scaffold` consumer exits 2, so no core change is checked against a real
consumer. 0.33.0 broke the typecheck of every product and 0.33.1 was a partial release.

### Sources

- STA-2705 (owner decision of 2026-11-20) and the readiness audit item 7.1 — FR-1, FR-4
- `.agents/specs/sta-1813-product-gate/spec.md` FR-008, FR-013 and open question 6; ADR 0500 decision 3 — FR-1, FR-2, FR-3
- ADR 0515 decision 3 (`stackra create --starter`, `--tarballs`) — FR-1
- ADR 0019 (pinned actions, least privilege), ADR 0525 (sops scopes), ADR 0166 (CI policy) — FR-4
- The box-2 runs of 2026-11-26 (gen `kind_unregistered_base`, `permission_unknown`, `generated_dependency_missing`) — FR-5
- The runs of 2026-11-26, all RED: box 2 at the committed pin (`install`), box 2 with the STA-2794 PRs and a
  hand-made starter fix (`format`, `spell`, `validate`), and CI on this pull request at `install`,
  <https://github.com/stackra-inc/stackra/actions/runs/45878145029>; tracked under STA-2839 (STA-2869, STA-2870, STA-2871). The gate ships
  advisory — FR-4

## Impact

- **Apps touched**: `apps/docs` (the consumer gate section of `runbooks/release.mdx`)
- **Services touched**: none
- **Packages touched**: `packages/developer/cli` (the `consumer-gate` command and `src/node/consumer-gate/`; changeset)
- **Public contract change**: `stackra consumer-gate` gains `--pin` and runs `kind: scaffold`; the matrix gains `pinned`,
  `profile`, `service` and `dependencies`
- **Cross-service events**: none
- **Tenancy and data**: none (the scaffold app is a throwaway under `--out`; its integration test uses its own Postgres)
- **Security and privacy**: a read-only workflow; no write token, no secret value
- **Secrets**: none; the optional turbo cache decrypt reads the sops scope `ci/build/turbo` by name only
- **ADR needed**: no (implements ADR 0500 decision 3 and spec sta-1813 FR-008 and FR-013)
- **New dependencies**: none
- **Deploy modes**: internal CI tooling only; the same everywhere
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `runbooks/release.mdx`, `packages/developer/cli/README.md`, `.github/workflows/README.md`
- **Lane**: full
- **Change risk**: R2 (CI policy: a check that can block a release)

## Requirements

- **FR-1** `stackra consumer-gate --product scaffold` makes an app the way a user does, with the core tree's own built
  CLI: `stackra create --starter <checkout> --tarballs <out>/tarballs` (files only), then `stackra new service
<service> --area app --data`, the matrix `fixture` copied into that service and the matrix `dependencies` added to its
  `package.json`; then the usual steps in pack mode.
- **FR-2** Every matrix entry carries `pinned`; the summary flags a pin older than 14 days, or undated, as stale.
- **FR-3** `stackra consumer-gate --product <name> --pin` prints `<repo> <ref>` and runs nothing.
- **FR-4** `.github/workflows/consumer-gate.yml` runs the scaffold on the version packages pull request, a pull request
  labelled `consumer-gate`, pushes to main touching a package, dispatch and `workflow_call`, read-only.
- **FR-5** The fixture is written as a user writes an action today (schemas, permissions), and a failed step names the
  Stackra toolchain's failure lines (gen, oxlint, cspell, oxfmt, validate).

## Acceptance criteria

- **AC-001**: WHEN the gate runs `scaffold` THE command SHALL create the app with the core tree's CLI on the packed tarballs, add the service with `--data`, copy the fixture and add the dependencies before it installs.
- **AC-002**: IF the scaffold's create or service step fails THEN THE gate SHALL skip every later step and exit 1, and no allow entry SHALL excuse it.
- **AC-003**: IF a scaffold run asks for link mode, or its checkout has no `stackra.starter.yaml`, or core has no built CLI, or the fixture is outside core THEN THE command SHALL exit 2 naming the problem.
- **AC-004**: WHEN a summary is written THE gate SHALL state the pin's date and age and flag it stale past 14 days or undated.
- **AC-005**: WHEN `--pin` is given THE command SHALL print the repository and pinned commit and run no gate.
- **AC-006**: WHEN the version packages pull request opens or changes THE consumer gate workflow SHALL run the scaffold gate with no write token.
- **AC-007**: WHEN a Stackra toolchain step fails THE summary SHALL name its failure lines.

## Status history

- 2026-11-26 → Clarified (from the owner decision on STA-2705 and the readiness audit; nothing open)
- 2026-11-26 → Planned (plan.md; awaiting the leader's approval, R2 CI policy)
