# Plan: exported return type for the called form of Policy

**Spec**: `.agents/specs/sta-1680-policy-called-form-dts/spec.md`

## Design

- `Policy<M>` becomes an exported interface (as `Role` is), so declaration emit names it instead of the unexported
  `PolicyBase`.
- Export `PolicyClass<M>` (`abstract new () => Policy<M>`) from the `.` entry and make the called form return it.
- A declaration-emit test compiles a consumer policy and asserts no TS4094.

## Constitution Check

| Law                       | Result | Note                                 |
| ------------------------- | ------ | ------------------------------------ |
| Boundaries (ADR 0003)     | PASS   | one package, no new import           |
| Tenancy                   | PASS   | none                                 |
| Secrets                   | PASS   | none                                 |
| Not built yet (ADR 0227)  | PASS   | nothing introduced                   |
| Test placement (ADR 0022) | PASS   | `src/core/bases/__tests__/`          |
| Versions and catalogs     | PASS   | `typescript` already `catalog:build` |
