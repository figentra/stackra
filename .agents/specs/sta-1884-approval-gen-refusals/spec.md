# Approval stage: the gen refusals in actions and tenancy

**Linear**: STA-1884
**Status**: implementing
**Clarifications status**: complete

## Problem

`stackra gen` refuses two members on main, so the Quality Gate stops at Typecheck (`gen:workspace`). The code is
STA-1724's approval stage (ADR 0509), merged by the consolidation (STA-1829):

- `@stackra/actions`
  - `memory-approval-gate.driver.ts:76` `token_not_a_class`: the driver's constructor takes a plain
    `MemoryApprovalGateOptions` object, and gen wires only class-typed parameters.
  - `approval-executor.listener.ts` `kind_class_name`: a listener in `approval-executor.listener.ts` must be named
    `ApprovalExecutorListener`.
- `@stackra/tenancy`
  - `PruneApprovalBindingsAction`: the input and the output of `handle` are not Schema classes of the member
    (`action_handle_signature`, twice).
  - `ApprovalBinding.approvals` is a number field with no `@Int` or `@Num` (`shape_number_kind`).
  - The permission `tenancy.approval_binding.prune` is declared by no Permissions class (`permission_unknown`).

## Change

Each fix follows gen's own fix text, with no behaviour change:

1. `MemoryApprovalGateDriver` takes its two dependencies, `IdentityResolver` and `Clock` (both ports), through the
   constructor, so gen can wire it; the cap and the tenant rules stay test configuration, set through the static
   `MemoryApprovalGateDriver.of(options)`, which keeps `MemoryApprovalGateOptions` and every existing caller's options.
2. The listener class is renamed `ApprovalExecutorListener`, with its imports.
3. `PruneApprovalBindingsAction` gets an Input and an Output Schema class, each in its own file in `schemas/`
   (ADR 0305).
4. `ApprovalBinding.approvals` gets `@Int` (a count of approvals).
5. The approval-binding Permissions class declares `prune`, at the level the action's risk calls for.

## Acceptance

- `stackra gen` writes `@stackra/actions` and `@stackra/tenancy` with no refusal.
- Every existing approval-stage test passes unchanged in what it asserts (callers move to `of(...)`).

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: @stackra/actions, @stackra/tenancy
- **Cross-service events**: none
- **Tenancy and data**: `ApprovalBinding.approvals` gains a validation rule only; no column changes
- **Secrets**: none
- **ADR needed**: no; it applies ADR 0509 and ADR 0294's gen rules
- **New dependencies**: none
- **Deploy modes**: none
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: bug
- **Change risk**: R1
