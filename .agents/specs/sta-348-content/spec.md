# Feature Specification: `@stackra/content` wave 7, content types and custom fields

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/content` (data, wave 7): the built-in content entry types that clients filter content by,
and bounded custom fields that are data only (ADR 0116 CT2, ADR 0154, ADR 0226): registered field types, a stored
definition per field, values in a side table checked against the stored definitions, the `HasCustomFields` trait and
the plan limit on how many fields a scope may define.

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's content service and apps adopt it once converted, STA-344)
- **Packages touched**: `packages/data/content` (new member)
- **Cross-service events**: none
- **Tenancy and data**: two tables in the `content` Postgres schema, `custom_fields` and `custom_field_value_sets`,
  each keyed by `scope_id` with a denormalised `scope_path` under forced row-level security on `app.scope_paths`; no
  tenant vocabulary (R-59, ADR 0323)
- **Secrets**: none
- **ADR needed**: no (ADR 0116, 0226 and 0321 decide the package and its traits; ADR 0154 and 0327 bind it)
- **New dependencies**: none outside the workspace and the catalogs (`zod` from the default catalog); runtime edges
  to contracts, database, entitlements, errors and model
- **Deploy modes**: same code in all; no network, clock or environment read
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/data/content/README.md`, `packages/data/content/AGENTS.md`; ADR 0116, 0154, 0226, 0321 and 0327 are cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R2 (new public contract and two tenant-facing tables)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row, ADR 0116 as amended by 0226, ADR 0321 and the owner decisions of 2026-10-24
(programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry row: `.` exports `ContentEntryType`, the one symbol the template imports (`Enum.values(ContentEntryType)` in
  the content client's list input, `ContentEntryType.Testimonial` and `ContentEntryType.Faq` in the loaders)
- `ContentEntryType` holds the built-in types of ADR 0116 CT4; tenant-defined types (ADR 0226) are data and never cases
- Data only (ADR 0154): a field definition is a strict typed object of registered field types, bounds and choices; an
  unknown key is refused and a label carrying a template expression is refused (ADR 0226 enforcement)
- Values live in a side table (ADR 0116 CT2), one row per record holding a jsonb map checked against the definitions
- The plan limit of CT2 is `CustomFieldLimitEntitlement`, a limit counting `CustomField`; this package registers no gate
- `./node` is added for the models, the migration, the service, the trait and the entitlement (node-only code, ADR 0294
  d15); `./react` is not exported: no React code is in scope and an entry exists once its folder has a file
- Owner, 2026-10-24 (R-59, ADR 0323): no tenant vocabulary; both tables are keyed by `ScopeRef` from `@stackra/contracts`

## User Scenarios & Testing

### User Story 1 - Filter content by a built-in entry type (Priority: P1)

A web loader asks the content service for `{ siteId, type: ContentEntryType.Faq }`; the generated client's input schema
is `z.enum(Enum.values(ContentEntryType))`.

**Independent Test**: `src/core/enums/__tests__/content-entry-type.enum.test.ts`.

**Acceptance Scenarios**:

1. **Given** the enum, **When** the client builds its input schema, **Then** `faq` and `testimonial` are accepted and an
   unknown type is refused.

### User Story 2 - Define a custom field (Priority: P1)

An admin of a scope adds "Shoe size" (a select of sizes) to products; the host's action calls
`CustomFieldService.define(scope, "catalogue.product", definition)`.

**Independent Test**: `src/core/functions/__tests__/check-custom-field-definition.function.test.ts`,
`src/node/services/__tests__/custom-field.service.test.ts`.

**Acceptance Scenarios**:

1. **Given** a valid definition, **When** it is defined, **Then** a `cfd_` row is stored in the scope.
2. **Given** an extra key, a select without choices, `min` above `max` or a label with `{{`, **When** it is checked,
   **Then** it refuses `custom_field_definition_invalid` with field errors.
3. **Given** a key already defined for the model in the scope, **When** it is defined, **Then** it refuses
   `custom_field_taken`.

### User Story 3 - Write and read a record's custom values (Priority: P1)

The product form saves `{ shoeSize: "42" }`; the product page reads it back.

**Independent Test**: `src/core/functions/__tests__/check-custom-fields.function.test.ts`,
`src/node/services/__tests__/custom-field.service.test.ts`.

**Acceptance Scenarios**:

1. **Given** values matching the definitions, **When** they are written, **Then** one row per record holds them.
2. **Given** a missing required value, an unknown key or a value of the wrong type, **When** they are written, **Then**
   it refuses `custom_fields_invalid` with one field error per key.

### Edge Cases

- `null` for an optional field clears it; `null` for a required field is refused.
- A `url` value must be `http` or `https`, so a stored link never carries a script scheme.
- A select value must be one of the choice values; a multi-select refuses a repeated value.
- A record with no stored row reads as `{}`.

## Requirements

- **FR-001**: The package SHALL be `@stackra/content` at `packages/data/content`, `tier:lib`, entries `.` and `./node`
  only.
- **FR-002**: `ContentEntryType` SHALL be an `Enum.of` of the built-in content types of ADR 0116 CT4, including `Faq`
  (`faq`) and `Testimonial` (`testimonial`).
- **FR-003**: `CustomFieldType` SHALL list the registered field types, and `checkCustomFieldDefinition` SHALL accept
  only a strict definition of them (key, type, label per locale, required, and the bounds and choices its type takes),
  refusing `custom_field_definition_invalid` with field errors otherwise, including a label holding a template
  expression.
- **FR-004**: `checkCustomFields(definitions, values)` SHALL return the values typed by their definitions and refuse
  `custom_fields_invalid` with one field error per refused key.
- **FR-005**: `CustomField` and `CustomFieldValueSet` SHALL be models with `cfd` and `cfv` public ids, keyed by
  `scope_id` with a GiST-indexed `scope_path` under forced row-level security, created by one migration;
  `CustomFieldService` SHALL define fields (refusing `custom_field_taken` for a repeated key), list a model's
  definitions, and write and read a record's values checked against them.
- **FR-006**: `HasCustomFields` SHALL be a trait made with `createTrait` that adds no field, and
  `CustomFieldLimitEntitlement` SHALL be a limit entitlement counting `CustomField` with no gated call.
- **FR-007**: No identifier, comment or default in the package SHALL carry tenant vocabulary.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package and the validator reports nothing for it; the typecheck
  waits for the integrator's install (a new package).

## Open items (for the owner, not blocking)

- The content traits ADR 0321 gives this package (`HasRevisions`, `Publishable`, `Sluggable`, `Schedulable`), the
  built-in content type models of CT4, tenant-defined content types at runtime (ADR 0226 d1) and headless delivery
  (0226 d3) are not built: none is imported by the template or listed in the row, and each needs a model design for the
  data-wave review (`Schedulable` comes after the core data packages, 0321 d6).
- The value side table is isolated by scope path like the definitions; once `@stackra/tenancy` ships its
  `belongsToTenant` macro the owner may move it to tenancy's equality policy (ADR 0327 d8 keeps row isolation there).
- Removing a definition is not offered: `CrudService` has no delete and the delete policy of a definition (soft,
  archive, purge of its values) is a data-wave decision.
- `CustomFieldService` takes the scope as a `ScopeRef` argument until the action context carries the current scope
  (ADR 0327 d6); row-level security refuses a scope outside the session's grants either way.
- The collaborative-editing `SnapshotStore` driver belongs to the content service, not this package (ADR 0270).

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · spec for a package written in owner mode (develop now, test later)
