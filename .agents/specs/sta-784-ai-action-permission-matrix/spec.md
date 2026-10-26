# Feature Specification: AI action permission matrix (record scope, propose mode, approver rule)

**Feature Branch**: `figentra/sta-666-wave11`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-784

**Clarifications status**: complete

**Input**: One AI action permission matrix across `@stackra/ai`, `@stackra/mcp` and `@stackra/actions`: the resolver
takes a record scope and a pack floor, the MCP filter works by role and record with a `locked` marker, a `propose` run
mode, and the approver rule `{ seatKind, notRequester, stepUp }` from the rule set.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/application/ai, packages/developer/mcp, packages/application/actions
- **Cross-service events**: `usage.recorded` on the `actions.proposals` meter (existing event)
- **Tenancy and data**: matrix rows are tenant rule-set data; nothing stored here
- **Secrets**: none
- **ADR needed**: yes, 0398 (Proposed)
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R2 (`filterTools` result shape changes)

## Requirements

- **FR-001** `ActionPermission` (off, suggest, after_approval, on_its_own), `ActionPermissionRow`, `RecordScope`;
  `ApprovalRules.matrix` and `packFloor`; `ApprovalFloor.actions`; `resolveApproval` honours the most specific row and
  both floors; outcome `propose`, step `matrix`, decision `approver`.
- **FR-002** `filterTools(tools, access, scope)` by role and record; `isOff` drops; `locked` marker on listed tools.
- **FR-003** `ActionPipeline.propose` returns an `ActionDraft` after the steps up to validation and meters it.
- **FR-004** `ApproverRule`, `Approver`, `ApproverRefusal` and `approverRefusal` (seat kind, self-approval through the
  on-behalf-of chain, step-up).

## Not built here

- The OS tasks-approvals `ApprovalGate` driver that reads the rule set and applies `approverRefusal`.
- `ui://` resources in the MCP listing; the product seed rows (`seed-pack:juristra`, Academorix).
- Tests, typecheck and build are written but not run (owner mode).
