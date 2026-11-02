# Feature Specification: the registry accepts contract and docs items

**Feature Branch**: `figentra/sta-1905-registry-contract-docs-kinds`

**Created**: 2026-11-02

**Status**: Implementing

**Linear**: STA-1905

**Clarifications status**: complete

**Input**: the registry Worker knows only package, skill, agent, mcp and plugin, and requires `<scope>/<kind>-<name>`
for every non-package kind. ADR 0511's contract packages (`@figentra/<x>-contract`: os#99, pay#26, invoicing#17)
and ADR 0514 decision 10's docs packages (`@figentra/<product>-docs`) are refused at publish.

## Impact

- **Apps touched**: `workers/registry` (`@figentra/worker-registry`)
- **Services touched**: none
- **Packages touched**: none (`StackraKind` in `@stackra/skills` already has `Contract`; `Docs` lands in #234)
- **Cross-service events**: none
- **Tenancy and data**: none (no D1 migration; `kind` is a text column)
- **Secrets**: none
- **ADR needed**: no (ADR 0511 and ADR 0514 d10 name both kinds and their names)
- **New dependencies**: none
- **Deploy modes**: the registry Worker; the owner runs Deploy registry
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** `stackra.kind` may be `contract` or `docs`.
- **FR-002** A contract or docs item is named `<scope>/<name>-<kind>`; the five older kinds keep `<scope>/<kind>-<name>`.
- **FR-003** The catalogue `kind` filter accepts both.
