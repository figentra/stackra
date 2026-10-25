# Feature Specification: `@stackra/achievements`, award kinds, criteria grants, revoke and verify

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete (defaults applied in owner mode; see Open items)

**Input**: Build `@stackra/achievements` (application, new package approved by OS ADR 0058, Stackra ADR 0368). Row of
`notes/handover/stackra-package-needs.md`: "Award kinds, criteria and auto-grant, revoke, opaque verify token and QR,
certificates (ported from Academorix's award code)"; asked by OS workforce and Academorix.

## Impact

- **Apps touched**: none
- **Services touched**: none (OS workforce is the first consumer)
- **Packages touched**: `packages/application/achievements` (new member)
- **Cross-service events**: `AwardGranted` (`achievements.award.granted.v1`) and `AwardRevoked`
  (`achievements.award.revoked.v1`), integration events through the outbox
- **Tenancy and data**: three tables in the `achievements` schema. `award_kinds` and `awards` carry `scope_id` and
  `scope_path` under forced row-level security (ancestor match). `award_verifications` has no policy by ADR 0368
  decision 5: token hash, award id and scope only (the cross-scope read the tenancy rule requires an ADR to name)
- **Secrets**: none
- **ADR needed**: yes, ADR 0368 (Proposed), written in this change
- **New dependencies**: `uqr` (QR encoding as SVG, isomorphic, no dependencies), from the default catalog; it must be
  added to `pnpm-workspace.yaml` by the integrator
- **Deploy modes**: same code in all
- **Licence tier**: free (MIT)
- **Docs to update**: the package README and AGENTS; the ADR index (integrator)
- **Lane**: lite
- **Change risk**: R2 (new public contract, three tables, one deliberately unscoped)

## Clarifications

Owner rules applied: configuration, not code (ADR 0363). From `answers-as-config.md`: award kinds are seed data
(ACA-179), automatic awards a rule set (ACA-180), certificate design a studio print template (ACA-181), verification a
capability (ACA-182), revoke a workflow template over this package's `revoke` (ACA-183). Conflicts #2, #3, #4 and #6
of the package-needs file do not touch this package; #6 (points in `@stackra/loyalty-kit`) matches OS 0058 decision 2.

## User Scenarios & Testing

### User Story 1 - Grant an award by hand (Priority: P1)

A manager grants "Employee of the month" for `2026-09`; a second grant for the same period is refused.

**Independent Test**: `src/node/services/__tests__/award.service.test.ts`, `src/core/functions/__tests__/check-grant.function.test.ts`.

### User Story 2 - Grant by criteria (Priority: P1)

An admin sets the criteria of a kind; a recipient whose facts match is granted the kind once (or once per period).

**Independent Test**: `src/node/services/__tests__/award-kind.service.test.ts`, `award.service.test.ts`.

### User Story 3 - Verify and revoke (Priority: P1)

A stranger scans the certificate's QR code and sees the award; after revoke the link resolves nothing.

**Independent Test**: `award.service.test.ts`, `src/core/functions/__tests__/verify-qr.function.test.ts`.

### Acceptance Scenarios

1. **Given** a once-per-period kind, **When** it is granted twice for one period, **Then** the second is refused
   `award_not_grantable` / `period_taken`.
2. **Given** an ascending kind and a recipient holding `yellow`, **When** `white` or `yellow` is granted, **Then** it
   is refused `level_not_higher`.
3. **Given** a kind with published criteria, **When** `consider` gets matching facts twice, **Then** one award exists.
4. **Given** two awards, **When** each token is verified, **Then** each resolves only its own award, in its scope.
5. **Given** a revoked award, **When** its token is verified, **Then** the result is null and its certificate is
   refused `award_revoked`.
6. **Given** a grant, **Then** the verification row holds the token's SHA-256 and never the token.

### Edge Cases

- A kind with levels takes no criteria (`criteria_with_levels`).
- An unregistered recipient model is refused (`recipient_unknown`).
- A malformed token resolves nothing without a query.

## Requirements

- **FR-001**: `@stackra/achievements` at `packages/application/achievements`, `tier:lib`, entries `./contracts`, `.`,
  `./node`.
- **FR-002**: Award kinds SHALL be scope records (key, name, recipient model, levels, ascending, once per period,
  criteria, certificate template, active); no kind is code.
- **FR-003**: Every grant SHALL pass `checkGrant`; a refusal names one `GrantRefusal` code.
- **FR-004**: Criteria SHALL be `@stackra/rules` rule sets evaluated with the clock's time on the consumer's facts.
- **FR-005**: Each award SHALL get an opaque 32-byte token; verify SHALL resolve only that award and nothing after
  revoke; the unscoped index SHALL hold only the hash, award id and scope.
- **FR-006**: A certificate SHALL expose the fields, the kind's template key, the verify URL (base from the caller) and
  an SVG QR code.
- **FR-007**: Grant and revoke SHALL record `AwardGranted` and `AwardRevoked` in the same transaction.

## Success Criteria

- **SC-001**: Spec, plan, tasks, ADR 0368 and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/` (owner mode: written, not run).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package.

## Open items (for the owner, not blocking)

- Add `uqr` to the default catalog in `pnpm-workspace.yaml`.
- AI granting floor (`settings:platform-floor:ai-no-awards`, ACA-314) belongs to the calling action.
- No unique index per kind, recipient and period; a short typeable verification code; wallet passes.
- Gen: the wire names of the two events and the generated `AchievementsModule` wiring.

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · owner mode (develop now, test later)
