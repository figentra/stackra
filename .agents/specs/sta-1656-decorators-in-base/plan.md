# Plan: typescript preset: experimentalDecorators in base

**Spec**: `.agents/specs/sta-1656-decorators-in-base/spec.md`

## Design

base.json; presets.test.ts; a Note on ADR 0025.

## Constitution Check

| Law                       | Result | Note                            |
| ------------------------- | ------ | ------------------------------- |
| Boundaries (ADR 0003)     | PASS   | tooling preset only             |
| Secrets (ADR 0173)        | PASS   | none                            |
| Security                  | N/A    | no runtime code                 |
| Not built yet (ADR 0227)  | PASS   | nothing new                     |
| Test placement (ADR 0022) | PASS   | `__tests__/` beside the presets |
| Versions and catalogs     | PASS   | no dependency change            |
