# Specification: a settings section applies its defaults when nothing is stored

**Feature Branch**: `figentra/sta-1826-settings-section-defaults`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1826

**Clarifications status**: complete

**Input**: Tamo's `GatewaySettings` declares sections as `routing!: RoutingSettings` (no initializer). The generated
schema emits the bare section schema, so a group with no stored value for a section parses `routing` as `undefined` and
`SettingsReader#get` throws a ZodError (`expected object, received undefined`) before the section's own field defaults
apply. Tamo's `GatewayMinimalSeeder.pack` repeats every section default so its tests pass. `@stackra/settings` documents
that a missing section reads its defaults.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/developer/gen` (`emit-schemas.function.ts`: a settings section field is emitted
  `.prefault(() => ({}))`); `packages/state/settings` (tests only; the reader already parses the generated schema)
- **Cross-service events**: none
- **Tenancy and data**: none; stored rows are unchanged
- **Secrets**: none
- **ADR needed**: no (ADR 0307 rule 22 already says a section reads its defaults; this makes the emission match)
- **New dependencies**: none
- **Deploy modes**: all, no change
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: lite
- **Change risk**: R2 (generated schema text of every settings class with a section; a consumer must rerun `stackra gen`)

## Requirements

- **FR-001** A settings class's section field (a schema-typed field with no initializer) is emitted
  `<Section>$.prefault(() => ({}))`, so a missing section parses its fields' defaults.
- **FR-002** A partial stored section keeps its stored values and defaults the rest.
- **FR-003** A stored value of the wrong type, in a section or not, is still refused; `.prefault` applies to `undefined`
  only, and a section field with its own initializer keeps `.default`.
- **FR-004** A section field of a shape that is not a settings class is emitted as before.

## Status history

- 2026-11-01 -> Clarified (Tamo product blocker)
