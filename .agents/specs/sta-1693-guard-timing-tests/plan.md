# Plan: Guard timing tests are load-proof

**Spec**: `.agents/specs/sta-1693-guard-timing-tests/spec.md`

## Design

See the spec's Behaviour; one commit.

## Constitution Check

| Law                       | Result | Note                            |
| ------------------------- | ------ | ------------------------------- |
| Boundaries (ADR 0003)     | PASS   | no new import across tiers      |
| Secrets (ADR 0173)        | PASS   | none                            |
| Security                  | N/A    | no runtime behaviour changes    |
| Not built yet (ADR 0227)  | PASS   | nothing new                     |
| Test placement (ADR 0022) | PASS   | `__tests__/` beside the subject |
| Versions and catalogs     | PASS   | no dependency change            |
