# Plan: clear the typecheck errors on main

**Spec**: `.agents/specs/sta-1911-typecheck-sweep/spec.md`

## Design

- Fix each test fixture to the current API (`ListenerContext.audit`, `MemoryApprovalGateDriver.of`, Schema inputs).
- analytics: type the delegation schema so `@Field` accepts the field type.
- console: `run-command` timer typed for Node so `.unref()` checks.
- Verify on the testbed with `ci-box`.

## Constitution Check

| Law                   | Result | Note                           |
| --------------------- | ------ | ------------------------------ |
| Boundaries (ADR 0003) | PASS   | no new imports across packages |
