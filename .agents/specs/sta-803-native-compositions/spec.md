# Feature Specification: native assistant, approval, plan, scheduler and signature; review pages

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-803

**Clarifications status**: complete

**Input**: Native versions of `AssistantPanel`, `ApprovalCard`, `PlanView`, `ResourceScheduler` and `SignatureField`;
playground routes and `apps/mobile` review screens for the new `@stackra/ui` and ui-pro components; record the
Turnstile-entry question.

## Impact

- **Apps touched**: apps/playground (8 routes), apps/mobile (8 review screens, routes and deep links)
- **Services touched**: none
- **Packages touched**: packages/design-system/ui-pro
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (ADR 0310 decision 3 covers the compositions); the Turnstile question is recorded in ADR 0430
- **New dependencies**: none (Skia was already a peer of ui-pro)
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** Native `AssistantPanel`: heading, visible AI label (`AiMark`), header actions, conversation, composer.
- **FR-002** Native `ApprovalCard`: `@stackra/ui` Card with the status as a translated word in a chip; reject,
  escalate (with a handler) and approve while pending.
- **FR-003** Native `PlanView` on HeroUI Native Pro's Timeline: status tint plus the status word; text titles read
  with their status.
- **FR-004** Native `ResourceScheduler`: drag to move (time and column, mirrored in RTL), drag the bottom edge to
  resize, processing gaps, and screen-reader actions (`ui_pro::scheduler.*`) doing what a drag does.
- **FR-005** Native `SignatureField`: Skia strokes from PanResponder touches scaled to the box units, typed name, clear.
- **FR-006** Playground routes: `ai-mark`, `environment-banner`, `mode-switch`, `pro-assistant-panel`,
  `pro-approval-card`, `pro-plan-view`, `pro-resource-scheduler`, `pro-signature-field`.
- **FR-007** Mobile review screens for the same eight components, registered in `design-system-components.ts`,
  `navigation/types.ts` and `navigation/linking.ts`.

## Open item

- **Turnstile entry**: `@stackra/ui` keeps `Turnstile` in `./react` (wave 10 owner decision 12). Whether to add a
  `./turnstile` entry (moving the symbol) is an owner decision, recorded as ADR 0430 open question 2.

## Not built here

- The Keygen release and rename stay on STA-447.
- Tests are written but not run (owner mode).
