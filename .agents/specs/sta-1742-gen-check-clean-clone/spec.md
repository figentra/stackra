# Bug Specification: gen --check passes on a clean clone

**Feature Branch**: `figentra/sta-1742-gen-check-clean-clone`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1742

**Clarifications status**: complete

**Input**: Core 0.2.1 release task (leader, 2026-11-01). The template's CI found that `stackra gen --check` fails on a
clean clone and passes after `pnpm gen`: the check reports every gitignored file gen would write (`.stackra/**`, the
root tool-config shims such as `vitest.config.ts`) as changed, because none exists before gen runs.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/developer/gen` (`generate.function.ts`, its test)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (ADR 0294 R10 already names the committed contract)
- **New dependencies**: none
- **Deploy modes**: build-time tooling only
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: bug
- **Change risk**: R1 (the check reports less: only missing committed files and differing existing ones)

## Requirements

- **FR-001** `generate(root, { check: true })` does not report a generated file that is missing on disk unless it is
  a committed contract (`stackra.manifest.json`, `openapi.json`).
- **FR-002** A missing manifest and an existing file that differs are still reported.
- **FR-003** A test: after gen, `.stackra/` and the root shim are removed, and the check reports nothing.

## Status history

- 2026-11-01 → Clarified (task from the leader for core 0.2.1)
