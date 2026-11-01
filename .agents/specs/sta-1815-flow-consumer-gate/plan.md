# Implementation Plan: Figentra Flow orchestrates the consumer gate on every core train

**Spec**: `spec.md` · **Linear**: STA-1815 · **Branch**: `figentra/sta-1815-flow-consumer-gate`

Cross-repository. Almost every step is built in **figentra/flow** by its owner; core's steps are data, one config
section, a runbook and branch protection. Nothing here is built on this branch, which holds the spec and plan only.
Flow's module names below are placeholders; Flow's owner chooses them.

## Constitution Check

| Law                       | Result | Note                                                                                                                 |
| ------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| Boundaries (ADR 0003)     | PASS   | Flow is a separate repository and package; core imports nothing from it, and it reads core only as files and git     |
| Tenancy                   | N/A    | no tenant data; tenant isolation appears only as a failure class that can never be allow-listed (FR-009)             |
| Secrets (ADR 0173)        | PASS   | no new secret; names only; Flow's App key stays in `figentra-flow-gate` read by `figentra-flow-box` (ADR 0484)       |
| Security                  | PASS   | Flow posts statuses and opens pull requests only; it never merges, never edits a branch it did not create            |
| Not built yet (ADR 0227)  | PASS   | no rejected or deferred technology; no gateway, no new runtime in core                                               |
| CI policy (ADR 0166)      | PASS   | the required status waits for the owner's amendment of CI2 (spec, ADR needed); until then `product-gate` is advisory |
| Test placement (ADR 0022) | N/A    | no core code; Flow's tests follow figentra/flow's own layout                                                         |
| Versions and catalogs     | N/A    | no catalog change in core; Flow is not a core dependency until W2 adds it through a catalog                          |

## Deploy modes

| Mode       | Result | Note                                  |
| ---------- | ------ | ------------------------------------- |
| saas       | N/A    | internal release tooling, not shipped |
| on-prem    | N/A    | internal release tooling, not shipped |
| air-gapped | N/A    | internal release tooling, not shipped |

## Build order

| Step | Repository    | What                                                                                                                                                                                      | Gate                                              |
| ---- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 0    | both          | Prerequisites: STA-1813 on core main; W2 (core runs Flow, STA-1729 phase 6)                                                                                                               | merged                                            |
| 1    | figentra/flow | Config schema: the `consumerGate` section (FR-001); a release of `@figentra-oss/flow`                                                                                                     | Flow's owner                                      |
| 2    | core          | `figentra-flow.config.json` gains `consumerGate`; `allow.yaml` header documents `class` (FR-009); STA-1813 summary gains the environment fields (FR-012)                                  | `pnpm verify`; leader review                      |
| 3    | figentra/flow | Dispatcher: one runner call per product or pin group, the box script, result collection, aggregate summary, `product-gate` posting, PR comment (FR-002, FR-006, FR-007, FR-012 to FR-014) | dry run against `land/031-stack`, status advisory |
| 4    | figentra/flow | Version Packages carry-over (FR-003) and the latest lane with Linear issues (FR-004)                                                                                                      | one nightly run reviewed by the leader            |
| 5    | figentra/flow | Allow-list check, reminders and expiry pull requests (FR-009, FR-010); pin bump pull requests (FR-011)                                                                                    | refusal tests; one bump PR reviewed               |
| 6    | core          | ADR 0166 CI2 amendment (owner), then branch protection requires `product-gate` on the release paths (FR-015); runbook                                                                     | **owner**                                         |
| 7    | both          | Fallback on the GitHub-hosted `product-gate.yml` (FR-016, STA-1813 step 4); owner override (FR-008)                                                                                       | leader review (R2)                                |
| 8    | both          | Certified lockfile: stored resolved lockfile now, `--mode pack` with the committed lockfile later (FR-005)                                                                                | reproduce run (SC-006)                            |

## Design notes

- **Layers.** `stackra consumer-gate` judges one product against one core tree and knows nothing of trains, Linear or
  GitHub. Flow decides when, where and who blocks, and never re-reads a log to judge it: it trusts the exit code and the
  summary. Runway's readiness spec is the deploy tier and does not share code with either.
- **One box per product.** The runner is the config's `runner`; the command each box runs is a short script Flow
  owns: clone core at the gated SHA and the product at its pin with the read token (never written to a file), copy the
  overlays from the box path named in the config, run `timeout 90m stackra consumer-gate --core . --checkout ../<p>
--product <p> [--services ...] --overlays ../overlays --out ../gate-out`, add the box fields to the environment
  record (image digests from Docker, Node and pnpm versions), and return `gate-out`.
- **Aggregation.** All products GREEN gives `success`; any RED `failure`; any setup error, timeout or lost box
  `error`. `error` is not `failure`, so an outage is never read as a product defect, and both block.
- **Carry-over.** The Version Packages PR is the train's code plus versions; re-running about 35 minutes of boxes to
  prove that changesets edits are harmless is waste. The path filter (`package.json` `version`, `CHANGELOG.md`,
  `.changeset/`) is narrow so a code change cannot slip through.
- **Allow-list classes.** The `class` field is enforced in two places: Flow's check on the allow-list pull request,
  and (asked of STA-1813) `stackra consumer-gate` refusing a forbidden class as a malformed entry, which already makes
  the run RED. The critical-file hit (open question 5) is Flow's, because it needs the product's list.
- **Linear.** Flow uses the config's tracker; latest-lane issues are keyed by product and failure signature so a
  repeated failure updates one issue. Linear failing never fails the lane (ADR 0065 rule 7).
- **What stays manual.** Merging pin bumps and allow-list changes, the owner override, the ADR amendment and branch
  protection.

## Properties

- **P-001**: Flow's schema accepts the `consumerGate` section and refuses an unknown key; core's config validates against the released schema — Validates: FR-001
- **P-002**: A train PR open, synchronise or reopen, a Version Packages open or synchronise, and a manual run each dispatch the certified lane once; a newer head cancels the superseded run — Validates: FR-002
- **P-003**: A version PR that differs from the passed train merge only in version fields, changelogs and `.changeset/` gets the carried status; any other path triggers a run — Validates: FR-003
- **P-004**: The latest lane runs on schedule against both mains, never posts `product-gate`, and files or updates one issue per product and signature — Validates: FR-004
- **P-005**: A certified run uses the matrix pin and the stored or committed lockfile, and records which — Validates: FR-005
- **P-006**: One runner call per product or pin group, with the train, product and lane in the label, and the command never handed a secret on argv — Validates: FR-006
- **P-007**: Exit codes map to `success`, `failure` and `error` as specified; a timeout or lost box is `error` — Validates: FR-007
- **P-008**: Only the certified lane posts the status; an override requires the owner, a reason and an STA key and is commented on the issue — Validates: FR-008
- **P-009**: The allow-list check refuses a forbidden class, a critical-file hit, an unknown or closed issue, an expiry beyond 30 days, a missing reason and an unreviewed agent entry — Validates: FR-009
- **P-010**: Reminder at seven days, removal PR after expiry, removal PR for an unused entry or a Done issue; Flow edits only its own branches — Validates: FR-010
- **P-011**: A green latest run opens or updates one bump PR per product; a red one never does; a pin over 14 days behind is reported — Validates: FR-011
- **P-012**: Every per-product result carries every environment field, and none holds a secret — Validates: FR-012
- **P-013**: One aggregate summary per SHA and lane is stored with its inputs and written as one PR comment updated in place — Validates: FR-013
- **P-014**: A reproduce line re-runs one product with the same environment record — Validates: FR-014
- **P-015**: Branch protection requires `product-gate` from the `figentra-gate` App on the release paths only — Validates: FR-015
- **P-016**: With no healthy box, the fallback workflow runs the lane and the status follows the same rules — Validates: FR-016
