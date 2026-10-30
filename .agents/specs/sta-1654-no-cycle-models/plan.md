# Plan: oxlint preset: no-cycle among models

**Spec**: `.agents/specs/sta-1654-no-cycle-models/spec.md`

## Design

base.jsonc override; fixtures under `__tests__/fixtures/cycle`, skipped by the boundaries test; `no-cycle.test.ts`.

## Constitution Check

| Law                       | Result | Note                            |
| ------------------------- | ------ | ------------------------------- |
| Boundaries (ADR 0003)     | PASS   | tooling preset only             |
| Secrets (ADR 0173)        | PASS   | none                            |
| Security                  | N/A    | no runtime code                 |
| Not built yet (ADR 0227)  | PASS   | nothing new                     |
| Test placement (ADR 0022) | PASS   | `__tests__/` beside the presets |
| Versions and catalogs     | PASS   | no dependency change            |
