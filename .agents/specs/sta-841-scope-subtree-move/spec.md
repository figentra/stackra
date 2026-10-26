# Feature Specification: scope subtree move (re-paths scope_path rows)

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-841

**Clarifications status**: complete

**Input**: OS gate-A gap G1 (services/tenancy SPEC): a moved tenant keeps its old path, so the new organisation's
grants do not reach it.

## Impact

- **Apps touched**: none
- **Services touched**: none (each OS service adds its own listener)
- **Packages touched**: packages/security/scope, packages/data/database
- **Cross-service events**: `scope.node.moved.v1` (`ScopeMoved`: `scopeId`, `from`, `to`)
- **Tenancy and data**: rewrites `scope_path` prefixes inside the caller's scope session; row-level security unchanged
- **Secrets**: none
- **ADR needed**: yes, 0411 (Proposed)
- **New dependencies**: `@stackra/events` (workspace) in @stackra/scope
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R2

## Requirements

- **FR-001** `ScopeNodeService.move(scope, parent)` re-paths the node and its descendants in one statement, keeps ids
  and labels, and records `ScopeMoved`; a move to the current parent changes nothing.
- **FR-002** A parent at or below the node is `ScopeMoveInvalidError` (`scope_move_invalid`); a level the parent does not
  take is `ScopeLevelInvalidError`.
- **FR-003** `CrudService.repath(from, to)` rewrites the `ltree` prefix of every row at or below `from`, parameterised,
  in the caller's transaction; returns the row count; refuses a non-ltree path or a move under itself.

## Not built here

- Each OS service's `ScopeMoved` listener (service code, OS tenancy).
- Tests, typecheck and build are written but not run (owner mode).
