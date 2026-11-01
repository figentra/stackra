# Plan: approval-stage gen refusals (STA-1884)

1. actions: `MemoryApprovalGateDriver(identity, clock)` plus `static of(options)`; move the three callers to `of`.
2. actions: rename the listener class to `ApprovalExecutorListener` and its imports and tests.
3. tenancy: Input and Output schemas for `PruneApprovalBindingsAction`; `@Int` on `ApprovalBinding.approvals`;
   `prune` in the approval-binding Permissions class.
4. Patch changesets; oxfmt and oxlint; gen and tests run in CI.
