# Feature Specification: call input makes defaulted fields optional

**Feature Branch**: `figentra/sta-1694-call-input-defaults`

**Created**: 2026-10-31

**Status**: Clarified

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-1694

**Clarifications status**: complete

**Input**: "`CallInput<T>` is `Fields<InputOf<T>>`, and a TypeScript type cannot see a property initializer, so a Schema
field like `capturedAt: Date | null = null` is required of every caller. Gen knows the initializers (it compiles them
as zod defaults), so gen tells the type system which fields are defaulted." Lead-approved typing fix.

## Status history

- 2026-10-31 → Clarified: lead-approved typing fix requested by the leader

## Impact _(mandatory, answer every line before /speckit.clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `@stackra/validation` (`InputFields`, the `~defaults` brand), `@stackra/actions` (`CallInput`), `@stackra/gen` (schemas emitter); the generated client is emitted from the same types, so no separate package
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no; it implements AGENTS.md "an initializer is the default"
- **New dependencies**: none
- **Deploy modes**: all (types only)
- **Lane**: lite
- **Change risk**: R2 (public types of every action call)
- **Licence tier**: free
- **Docs to update**: `CallInput` and `Fields` docblocks, `packages/foundation/validation/README.md`

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Call an action without its defaulted fields (Priority: P1)

**Acceptance Scenarios**:

1. **Given** an input with a defaulted field, **When** a caller passes an object without it to `run`, `dispatch` or a client call, **Then** it type-checks.
2. **Given** a required field, **When** it is omitted, **Then** it is a type error.
3. **Given** `handle(input)`, **When** it reads the defaulted field, **Then** the field is present (full class type).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `CallInput<T>` shall make the fields listed in a shape's `~defaults` brand optional, recursively for nested shapes.
- **FR-002**: Gen shall emit that brand, from the field initializers, as a module augmentation in the schemas file.
- **FR-003**: `Fields` and `X$Check` shall ignore the brand; authoring is unchanged.

## Success Criteria _(mandatory)_

- **SC-001**: a type test in actions and an emitter unit test in gen; `pnpm verify` is green.

## Assumptions

- A consumer regenerates (`stackra gen`) to see the change; until then every field stays required.
