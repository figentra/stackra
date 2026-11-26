# Feature Specification: the ADR index, the number register and customer citations match the ADR pages

**Feature Branch**: `figentra/sta-2851-adr-index-health`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: the CTO (the change risk's approval stop)

**Linear**: STA-2851

**Clarifications status**: complete

**Input**: The 26 Nov readiness audit (batch 16, item 16.3) found the ADR index out of step with the ADR pages. Re-checked
on main at fa7235b40: 8 pages had no index row (0464, 0466, 0467, 0468, 0476, 0483, 0485, 0531); the number register
still marked 6 written ADRs `reserved` (0506, 0509, 0511, 0512, 0513, 0522) and 0067 `accepted` although its page and
0510 say it is superseded, and the index row of 0067 said Accepted too; 0531 was a Figentra Pay product decision stub in
the framework's public docs; and three customer pages linked superseded ADRs (support.mdx and changelog.mdx cited
0013, install.mdx cited 0025). Nothing checked any of it. The audit's "7 reservations are unwritten" was 6 written ADRs
still marked reserved plus 0515, a live reservation whose ADR is in stackra#1129. The fix corrects the data and adds
two `stackra check` rules beside `adr-numbers` (STA-1732), with new exports from `@stackra/repo-checks/node`.

### Sources

- `apps/docs/src/docs/adr/index.mdx`, `apps/docs/adr/numbers.yaml`, `apps/docs/src/docs/adr/*.mdx` on main
- `apps/docs/src/docs/customers/{support,changelog,install}.mdx`
- `packages/developer/repo-checks/src/node/functions/check-adr-numbers.function.ts` and `config-findings.function.ts`
- The ADR template (`apps/docs/src/docs/adr/template.mdx`, status vocabulary and supersession rule)
- ADR 0013 decision 5, ADR 0025 decision 5, ADR 0177 decision 8, ADR 0195 decision 6, ADR 0468 (the release-note rule's
  chain)

## Impact

- **Apps touched**: docs (the ADR index, the register, the ADR template, three customer pages; the 0531 stub removed)
- **Services touched**: none
- **Packages touched**: repo-checks (rules `adr-index` and `customer-adr-links` in the config phase; new functions
  `checkAdrIndex`, `checkCustomerAdrLinks`, `adrStatusOf`, `descriptionOf`; constants `ADR_PAGE_PATH`,
  `ADR_INDEX_PATH`; types `AdrStatus`, `TextFile`; `checkAdrNumbers` reads `ADR_PAGE_PATH`, unchanged behaviour)
- **Public contract change**: additive exports from `@stackra/repo-checks/node` (above); `stackra check` config phase
  gains two rules, so a repository whose ADR pages disagree with their index or register now fails the phase
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none; the product stub 0531 leaves the public framework docs
- **Secrets**: none
- **ADR needed**: no; applies the ADR template's rules (index row per page, status vocabulary, supersession) and
  STA-1732's register. The register gains the status `external` for a number another product took
- **New dependencies**: none (`yaml` is already a dependency)
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `apps/docs/src/docs/adr/template.mdx`, `apps/docs/src/docs/adr/index.mdx`,
  `apps/docs/adr/numbers.yaml` header, `apps/docs/src/docs/customers/{support,changelog,install}.mdx`, a changeset
- **Lane**: full
- **Change risk**: R1 (docs data and a new repository check; no runtime, auth, tenancy, secret or HTTP change)

## Acceptance criteria

- **AC-001**: THE `adr-index` rule SHALL report an ADR page with no row in `apps/docs/src/docs/adr/index.mdx`, a row
  whose number has no page, a second row for one number, and a row linking another page than the number's.
- **AC-002**: THE `adr-index` rule SHALL report a row whose status cell does not open with the page's status (the
  description's leading word, and the superseding number when both name one), and a page whose description opens with
  no status of the template's vocabulary.
- **AC-003**: WHEN the repository keeps `apps/docs/adr/numbers.yaml`, THE `adr-index` rule SHALL report an entry whose
  status differs from its page, a `reserved` or `external` entry that has a page, any other entry without a page, and
  a status outside reserved, external, proposed, accepted, deferred, rejected, superseded.
- **AC-004**: THE `customer-adr-links` rule SHALL report a Markdown link on a customer page to an ADR that is superseded
  or rejected, or to no ADR page, with its line; links to accepted and proposed ADRs and bare "ADR NNNN" mentions pass.
- **AC-005**: A repository without ADR pages SHALL get no `adr-index` finding; a register that does not parse SHALL be
  left to `adr-numbers`.
- **AC-006**: ON main after this change, `stackra check --only config` SHALL pass: every page indexed with its status,
  the register matching, 0531 kept only as an `external` register entry, and the customer pages citing ADRs in force
  or the release runbook.

## Status history

- 2026-11-26 → Clarified (the audit item re-checked against main at fa7235b40)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Implementing (built in this branch on box 2)
