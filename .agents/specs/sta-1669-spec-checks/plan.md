# Plan: spec gate and trace as published checks

**Spec**: `.agents/specs/sta-1669-spec-checks/spec.md`

## Design

- `spec-*` functions, constants and types in `packages/developer/repo-checks/src/node/`, loaded by plain Node from
  source in this repository (relative `.ts` imports, erasable syntax only, exempt in `isMemberSource`, ADR 0421).
- `SPEC_PHASE` in `@stackra/cli` calls `specFindings` with real git and file I/O.
- Core's `.mjs` wrappers import the source through `tools/scripts/repo-checks.mjs` and adapt the core API (bare
  numbers, `STA-n` messages); a node:test runs wrapper and package against core's own `.agents/specs`.
- Vitest ports of the existing cases, one with a non-`sta` prefix; a packed-file guard per package.

## Constitution Check

| Law                       | Result | Note                                                      |
| ------------------------- | ------ | --------------------------------------------------------- |
| Boundaries (ADR 0003)     | PASS   | developer packages only; core scripts read package source |
| Secrets (ADR 0173)        | PASS   | none; Linear tokens stay in core's scripts                |
| Security                  | PASS   | read-only checks over files and git                       |
| Not built yet (ADR 0227)  | PASS   | nothing new                                               |
| Test placement (ADR 0022) | PASS   | `__tests__/` beside each subject                          |
| Versions and catalogs     | PASS   | no dependency change                                      |
