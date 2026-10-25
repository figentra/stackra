# Feature Specification: extend experience, builder, panel, ui, ui-pro, ai, registry and runway

**Feature Branch**: `figentra/sta-348-framework` (wave 10 worktree)

**Created**: 2026-10-25

**Status**: Implementing (owner mode: code and tests written, not run)

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Input**: the rows of `notes/handover/stackra-package-needs.md` for `@stackra/experience`, `@stackra/builder`,
`@stackra/panel`, `@stackra/ui`, `@stackra/ui-pro` (no rename, STA-447), `@stackra/ai`, `@stackra/registry` and
`@stackra/runway` (provider and region dimensions only, nothing deployed), under the configuration principle of
`notes/handover/config-model.md`.

## Impact

- **Packages touched**: the eight above; no app, service or other package.
- **Tenancy and data**: no table or migration. Every business value (floors, routes, regions, fee rates, opening
  hours, working week, review rules) is a caller's record or setting.
- **Secrets**: none read. Provider drivers resolve their own credentials (ADR 0100 decision 14).
- **ADR needed**: no new ADR; the cited ADRs (0100, 0156, 0245, 0270, 0280, 0307, 0335, 0350, 0352, 0354, 0355,
  0359, 0360) cover the mechanism. Open owner questions are listed in the build report.
- **New dependencies**: none.

## Requirements

| Id     | Package    | Requirement                                                                                                   | Source            |
| ------ | ---------- | ------------------------------------------------------------------------------------------------------------- | ----------------- |
| FR-001 | ai         | Approval-mode resolver in the fixed order, floor as data, one test per floor item                             | ADR 0360          |
| FR-002 | ai         | Model router by task, region and data class; tenant overrides first; disclosed fallback; closed classes       | ADR 0156, 0360    |
| FR-003 | ai         | Field allow-list per data class and data-driven redaction                                                     | ADR 0360 d15      |
| FR-004 | ai         | Token budget check, layered guardrails, eval runs, intent router                                              | ADR 0156, 0245    |
| FR-010 | registry   | Review state and transitions, developer sandbox, fee schedule and partner payout records                      | ADR 0355 d8       |
| FR-011 | registry   | Edition bundle and install plan (dependency order, bundle only, inert enhancements)                           | ADR 0335, 0350    |
| FR-020 | panel      | Saved views with grouping, sub-grouping, totals, sharing; `ViewStore` port                                    | ADR 0359 d14      |
| FR-021 | panel      | Normal and developer field visibility                                                                         | ADR 0359 d1-2     |
| FR-022 | panel      | `LineEntry` slot with one editor by layer; inert contributions                                                | ADR 0350          |
| FR-030 | ui         | `EnvironmentBanner`, `AiMark`, `ModeSwitch` on web and native; `./testing` entry                              | ADR 0280, 0360    |
| FR-040 | ui-pro     | `AssistantPanel`, `ApprovalCard`, `PlanView`, `ResourceScheduler`, `SignatureField` (web)                     | ADR 0310; row     |
| FR-050 | experience | Form, email-template and print-document kinds; server-side validator; section themes with revisions, rollback | ADR 0270          |
| FR-060 | builder    | Kinds and a reviewed block kit narrow the editor's palette and inserts                                        | ADR 0270; COM-358 |
| FR-070 | runway     | Cloud and region dimensions in the root runway, `checkRegions`, `regionsOf`                                   | ADR 0354 d4       |

## Success criteria

- SC-001: every new public symbol has a docblocked file, a test beside it, a barrel entry and a barrel-test entry.
- SC-002: no country, price, rate, provider choice or business policy appears as a constant in code.
- SC-003: the tests, typecheck and builds pass in the separate testing workflow (not run here, owner mode).
