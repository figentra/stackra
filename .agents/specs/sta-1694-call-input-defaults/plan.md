# Plan: call input defaults

**Spec**: `.agents/specs/sta-1694-call-input-defaults/spec.md`

## Design

- `Schema` declares an optional type-only `~defaults` (a string union of field names). `InputFields<T>` reads it.
- Gen's schemas file emits `declare module "<shape import path>" { interface X { readonly "~defaults"?: "a" | "b" } }`
  for each shape with initializers.
- `CallInput<T> = InputFields<InputOf<T>>`.

## Constitution Check

| Law                       | Result | Note                                               |
| ------------------------- | ------ | -------------------------------------------------- |
| Boundaries (ADR 0003)     | PASS   | actions already imports validation; gen emits text |
| Tenancy                   | PASS   | no tenant data                                     |
| Secrets                   | PASS   | none                                               |
| Not built yet (ADR 0227)  | PASS   | no new dependency                                  |
| Test placement (ADR 0022) | PASS   | `src/**/__tests__/`                                |
| Versions and catalogs     | PASS   | no catalog change                                  |
