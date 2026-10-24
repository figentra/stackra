# Feature Specification: `@stackra/registry` wave 2, module catalogue validation

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: resolved (registry v3.1 row: entry `.` only, depends on validation, purpose "module
catalogue validation, deterministic diagnostics, for the OS registry service"; ADR 0109 decision 4 makes the package
free; the template imports nothing from it)

**Input**: Build `@stackra/registry` (application, wave 2) for real: the structural and cross-member checks a registry
service runs on the `stackra.manifest.json` files CI publishes, returning diagnostics in a stable order.

## Impact

- **Apps touched**: none
- **Services touched**: none (the OS registry service consumes it later)
- **Packages touched**: `packages/application/registry` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none; no tables, no personal data. Manifests hold identities only
- **Secrets**: none
- **ADR needed**: no (ADR 0109, 0214, 0294 decisions 20 and 22, 0231, 0127 2026-10-24 note)
- **New dependencies**: none new; `@stackra/contracts`, `@stackra/container`, `@stackra/validation` through
  `workspace:*`; `zod` through `catalog:`
- **Deploy modes**: same in all; pure functions, no I/O (air-gapped safe)
- **Lane**: full (a new package)
- **Change risk**: R2 (a wrong pass lets CI publish a manifest that breaks consumers)

## User Scenarios & Testing

### User Story 1 - Reject a malformed manifest (Priority: P1)

CI publishes a member's `stackra.manifest.json`. The registry service parses it with `validate(CatalogueManifest, raw)`
(through `validateCatalogue`) and gets one `manifest_invalid` diagnostic per issue, with a dotted path.

**Independent Test**: `src/core/schemas/__tests__/catalogue-manifest.schema.test.ts`,
`src/core/functions/__tests__/validate-catalogue.function.test.ts`.

1. **Given** a manifest whose member key is not one snake_case segment, **Then** `manifest_invalid` at `member`.
2. **Given** a module with no `dependsOn`, **Then** `manifest_invalid` at `modules[0].dependsOn`.
3. **Given** an action whose risk is `L7`, **Then** `manifest_invalid` at `actions[0].risk`.
4. **Given** sections the package does not check (`ui`, `settings`), **Then** they are kept and do not fail.

### User Story 2 - Catch cross-member conflicts (Priority: P1)

**Independent Test**: `src/core/functions/__tests__/validate-catalogue.function.test.ts`.

1. **Given** two manifests with the same member key, **Then** `duplicate_member` on the later one, which is not checked
   further.
2. **Given** two members that declare the module `orders`, or the same action key, event name or permission key,
   **Then** `identity_collision` on the later declaration, naming the first owner.
3. **Given** an action or event whose `module` its member does not declare, **Then** `unknown_module`.
4. **Given** an action key, event name or permission key outside its module's namespace, **Then** `foreign_namespace`.
5. **Given** a module that depends on a module no manifest declares, **Then** `unknown_dependency`.
6. **Given** modules that depend on each other in a loop, **Then** one `dependency_cycle` per group of modules that
   reach each other (a strongly connected component, or a module that depends on itself), on the group's smallest
   module key, listing the group.

### User Story 3 - Deterministic output (Priority: P1)

1. **Given** the same manifests in any order, **Then** the diagnostics are equal, sorted by member, path, code and
   message, compared by code unit (never by locale).
2. **Given** a valid catalogue, **Then** the result is an empty array.

## Requirements

- **FR-001**: One entry, `.` (registry row, ADR 0127 2026-10-24 note).
- **FR-002**: `.` exports `validateCatalogue`, `CatalogueManifest`, `CatalogueDiagnosticCode` (value and type) and the
  `CatalogueDiagnostic` type. Nothing else.
- **FR-003**: `validateCatalogue` never throws on untrusted input; it returns diagnostics.
- **FR-004**: Structural checks go through `@stackra/validation` (`validate` over a registered shipped schema), not a
  second validator.

## Success Criteria

- **SC-001**: The template imports nothing from `@stackra/registry`; the registry row's purpose is covered by FR-002.
- **SC-002**: A test beside every public symbol, plus the barrel test, passes in the testing workflow.
- **SC-003**: Shuffling the input manifests never changes the output in the tests.

## Not in this build

- The registry client and the merged catalogue a consumer keeps (ADR 0109 decision 4, ADR 0214 decision 2): they need
  the registry service's API, which does not exist yet.
- The per-tenant install resolver (ADR 0214 decision 3) and the manifest version diff (ADR 0157): owned by the OS
  registry service.
