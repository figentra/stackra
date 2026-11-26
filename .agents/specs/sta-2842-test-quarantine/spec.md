# Feature Specification: a flaky-test quarantine and shared-box test rules in the repository gate

**Feature Branch**: `figentra/sta-2842-test-quarantine`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2842

**Clarifications status**: complete

**Input**: STA-2842, readiness batch 16 item 16.1. ADR 0182 decision 4 promises a flaky-test quarantine, but none
exists: a test can be switched off with `.skip`, `.todo` or `.skipIf` and nothing records why, and 22 such markers sit
untracked on main. Some tests also fail on a shared build box because they take fixed ports or host-wide files: the LAN
relay test binds ports 47913 and 47914 (STA-2777) and the promote and deploy tests take the host's deploy lock
(STA-2780); both fixes were closed unmerged and are carried on this branch.

### Sources

- `apps/docs/src/docs/adr/0182-testing-strategy-v2-tiers-coverage-infrastructure-and-policies.mdx` (decision 4)
- `apps/docs/src/docs/standards/testing.mdx`
- `packages/developer/cli/src/node/constants/validate-command.constant.ts` (the `--repository` findings)
- `packages/developer/cli/src/node/row-security-declarations/` (the same reviewed-list pattern, ADR 0282)
- `packages/runtime/realtime/src/node/drivers/__tests__/lan-realtime-local-relay.driver.test.ts` (STA-2777)
- `packages/developer/cli/src/node/commands/__tests__/promote.command.test.ts` (STA-2780)

## Impact

- **Apps touched**: apps/docs (the testing standard)
- **Services touched**: none
- **Packages touched**: packages/developer/cli (new `test-markers` folder, wired into `validate --repository`; two
  tests take a stand-in deploy lock), packages/runtime/realtime (one test takes free ports),
  packages/developer/flow-preset (the test-engineer agent text)
- **Public contract change**: `stackra validate --repository` reports unlisted or ended test markers and shared-box
  rule breaks; `@stackra/cli` exports `QUARANTINE_MAX_DAYS`, `TEST_MARKERS_LIST_FILE`, `testMarkers`,
  `testMarkerFindings`, `sharedBoxFindings`, `testFiles`, `maskCode` and the `TestMarker` type; the new list file `tools/scripts/test-markers.yaml`
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none (reads test source files only)
- **Secrets**: none
- **ADR needed**: no (implements ADR 0182 decision 4)
- **New dependencies**: none (`yaml` is already a dependency of `@stackra/cli`)
- **Deploy modes**: same in all three (a repository gate, not a host)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `apps/docs/src/docs/standards/testing.mdx` (two sections and two enforcement rows),
  `packages/developer/cli/README.md` (the `validate --repository` row), the test-engineer agent
- **Lane**: full
- **Change risk**: R2 (a new gate finding can fail `pnpm validate` on a checkout with an unlisted marker; the 22
  existing markers are listed on this branch so main stays green)

## Acceptance criteria

- **AC-001**: WHEN a test file holds a `skip`, `todo`, `fixme`, `fails`, `skipIf` or `runIf` marker (also `xit`,
  `xdescribe`, member chains such as `it.concurrent.skip` and `it.skip.each`, and node:test `{ skip }` / `{ todo }`
  options) that `tools/scripts/test-markers.yaml` does not list THE `validate --repository` command SHALL report it
  with its file, line and title and exit 1.
- **AC-002**: WHEN a marker is listed under `gates` THE command SHALL accept it only if it is a `skipIf` or `runIf`
  marker and its entry gives a reason.
- **AC-003**: WHEN a marker is listed under `quarantine` THE command SHALL accept it only with a Linear issue key, a
  reason and an `until` date no earlier than today and at most `QUARANTINE_MAX_DAYS` (30) days out.
- **AC-004**: WHEN a test file holds a committed `.only`, a marker names no title, a marker is listed under both
  sections, a listed entry matches no marker, or the list does not parse THE command SHALL report it.
- **AC-005**: WHEN a test binds a literal port, declares a fixed `*_PORT` constant, or writes to a fixed `/tmp` path, a
  fixed name under `tmpdir()` or the real home folder THE command SHALL report it, unless the line or the line above
  carries `// shared-box: <reason>`.
- **AC-006**: THE marker and shared-box readers SHALL ignore text inside comments, strings, template text and regular
  expressions.
- **AC-007**: THE LAN relay test SHALL take its ports from the operating system, and the promote and deploy tests SHALL
  take a stand-in deploy lock, so that two runs on one host do not fail each other.
- **AC-008**: THE shipped list SHALL list every marker of this checkout, and this checkout SHALL have no shared-box
  findings.

## Status history

- 2026-11-26 → Clarified (STA-2842 "Done when" answers every question; ADR 0182 decision 4 fixes the quarantine)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md; built in the same branch)
- 2026-11-26 → Implementing (every task built and ticked; the Planned approval is the approver's to record)
