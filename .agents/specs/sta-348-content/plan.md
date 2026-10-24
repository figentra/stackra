# Plan: `@stackra/content` wave 7

**Spec**: `.agents/specs/sta-348-content/spec.md`

## Design

- Two entries through stand-in barrels (STA-339 replaces them): `.` from `src/core/` (isomorphic: the enums, the
  definition and value types, the two checks and the refusals, so a browser importing `ContentEntryType` pulls no ORM),
  and `./node` from `src/node/` (the module groups `models/`, `services/`, `access/`, `database/migrations/`, plus
  `traits/` for `HasCustomFields`).
- A definition is a plain typed object checked by a strict zod schema with a cross-field refinement per type; the field
  errors are zod's snake_case issue codes, or the refinement's own code (`choices_required`, `template_expression`).
- `checkCustomFields` builds one strict zod object from the definitions (each optional field nullable, its `null`
  dropped) and returns the parsed values frozen.
- `CustomFieldService extends CrudService<CustomField>` and injects `Repository<CustomFieldValueSet>` (gen wires
  `repositoryOf(CustomFieldValueSet)`); a write loads the record's row and changes it, or creates it, so both flush with
  the caller's unit of work.
- Both tables carry `scope_id` and `scope_path` with forced row-level security matching the session's
  `app.scope_paths`; the service selects the scope's own definitions by `scope_id`, which is a choice of node, not
  isolation.

## Constitution Check

| Law                                   | Result | Note                                                                                                                   |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/data/content`; imports only `tier:lib` packages; no app, service or `encore.dev`               |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                    |
| Security                              | PASS   | definitions and values are untrusted and checked strictly; a stored link is http or https only; refusals name no data  |
| HTTP and events                       | N/A    | no action, endpoint or event; the host module exposes the service through its own actions                              |
| Tenancy                               | PASS   | forced row-level security on both tables; no application isolation filter; no tenant vocabulary (R-59)                 |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology; tenant data carries no code (ADR 0154); `ltree` is an approved extension           |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                              |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                      |
| Deploy modes (ADR 0076)               | PASS   | one build in SaaS, on-prem and air-gapped                                                                              |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                     |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; ADR 0116, 0226 and 0321 stand, the open items are listed in the spec         |

- Boundaries: runtime imports of contracts, database, entitlements, errors and model; dev-only `@stackra/container`
  (`kindOf` in a test), `@stackra/testing` and the tooling presets.
- Versions: catalogs and `workspace:*` only.
- Naming: models are nouns, the service `CustomFieldService`, refusals end in `Error`, the trait `Has*`, no `define`
  prefix on a factory.

## Properties

- **P-001**: `package.json` names `@stackra/content` at `packages/data/content` and `exports` lists only `.` and `./node` — Validates: FR-001
- **P-002**: `Enum.values(ContentEntryType)` lists the CT4 types in source order and includes `faq` and `testimonial` — Validates: FR-002
- **P-003**: for every definition, `checkCustomFieldDefinition` returns it exactly when it is a strict definition whose bounds and choices fit its type, and otherwise refuses `custom_field_definition_invalid` with a field error per refused path — Validates: FR-003
- **P-004**: for every definitions list and values map, `checkCustomFields` returns the values exactly when each key is defined, each required key is present and each value parses under its type — Validates: FR-004
- **P-005**: the migration compiles both tables with their `cfd`/`cfv` keys, unique indexes and forced row-level security on `app.scope_paths`, and the service refuses a repeated key with `custom_field_taken` and a bad value with `custom_fields_invalid` — Validates: FR-005
- **P-006**: `traitsOf` lists `has_custom_fields` on a model using the trait and the model gains no field; `CustomFieldLimitEntitlement` is a limit counting `CustomField` — Validates: FR-006
- **P-007**: `grep -ri tenant packages/data/content/src` finds nothing — Validates: FR-007

## Deploy modes

| Mode       | Behaviour                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------- |
| SaaS       | the same build; the plan service grants the custom field limit                            |
| On-prem    | identical: the same build, no SaaS-only code path                                         |
| Air-gapped | identical: needs no network; definitions and values live in the deployment's own Postgres |
