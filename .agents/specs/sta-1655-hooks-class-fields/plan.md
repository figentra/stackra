# Plan: oxlint preset: hook fields in class components

**Spec**: `.agents/specs/sta-1655-hooks-class-fields/spec.md`

## Design

base.jsonc and boundaries.jsonc overrides after the rule's own; fixtures under `__tests__/fixtures/hooks`; `rules-of-hooks.test.ts`. The compiled-output hooks lint of ADR 0305 rule 41 is not built yet, so function components in those homes go unchecked until it is.

## Constitution Check

| Law                       | Result | Note                            |
| ------------------------- | ------ | ------------------------------- |
| Boundaries (ADR 0003)     | PASS   | tooling preset only             |
| Secrets (ADR 0173)        | PASS   | none                            |
| Security                  | N/A    | no runtime code                 |
| Not built yet (ADR 0227)  | PASS   | nothing new                     |
| Test placement (ADR 0022) | PASS   | `__tests__/` beside the presets |
| Versions and catalogs     | PASS   | no dependency change            |
