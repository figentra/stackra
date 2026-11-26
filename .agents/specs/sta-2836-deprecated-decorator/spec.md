# Feature Specification: `@Deprecated`, recorded by gen, and one deprecation policy page

**Feature Branch**: `figentra/sta-2836-deprecated-decorator`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: the CTO (the feature tier's Planned approval stop)

**Linear**: STA-2836

**Clarifications status**: complete

**Input**: ADR 0131 decision 4 records `@Deprecated({ since, replacement, sunset })` on an action, event, field, setting
or trait, and says gen records it in the manifest and warns on use; its Enforcement line said "planned". ADR 0136
decision 4 gives a public API a sunset at least 6 months out, and ADR 0177 decision 6 a deprecation window of one minor
before 1.0 and one major after. No decorator existed in `packages/**/src`, gen had no warning, and the policy was spread
across three ADRs. Split out of STA-145 (readiness batch 8, item 8.3, parent STA-2796). Re-verified on origin/main
`c4a19e87f`: `git grep` found no `Deprecated` decorator in any package source.

### Sources

- `packages/foundation/validation/src/core/decorators/renamed.decorator.ts` (the shape `@Deprecated` follows)
- `packages/foundation/container/src/core/functions/create-decorator.function.ts`
- `packages/developer/gen/src/node/functions/create-source-reader.function.ts` (`readField`, `readClass`, `facetOf`)
- `packages/developer/gen/src/core/functions/build-manifest.function.ts`, `open-api-of.function.ts`,
  `emit-clients.function.ts`, `json-schema-of.function.ts`, `generate-member.function.ts`
- `packages/data/model/src/core/functions/create-trait.function.ts` (a trait is a value; its options reach the registry)
- ADR 0131 decision 4, ADR 0136 decision 4, ADR 0177 decision 6, ADR 0294 decision 6 (decorator categories), ADR 0013
  decision 5 (release notes)

## Impact

- **Apps touched**: docs (new page `customers/deprecation`, the support page's Deprecation section, the programming
  model in English and Arabic, ADR 0131's Enforcement, the site navigation)
- **Services touched**: none
- **Packages touched**: contracts (the window functions and types, `StackraManifest.deprecations`); validation (the
  decorator and `DEPRECATABLE_KINDS`); gen (reading, manifest, OpenAPI, clients, warnings)
- **Public contract change**: additive only. `@stackra/contracts` exports `earliestSunset`, `deprecationProblem`,
  `sunsetReached`, the types `Deprecation` and `DeprecationProblem`, and `StackraManifest` gains the optional
  `deprecations` section. `@stackra/validation` exports `Deprecated`. `@stackra/gen` exports the type
  `DeprecatedTraitIR`; `DeclaredClass`, `FieldIR` and `MemberIR` gain optional fields; `SourceReader` gains
  `deprecatedTraits`. A manifest gains `deprecations` and `deprecated` on an action or event entry only when the member
  deprecates something, so no committed manifest changes.
- **Cross-service events**: none (an event entry may carry `deprecated`; the wire shape is unchanged)
- **Tenancy and data**: none; no table, no migration
- **Security and privacy**: none; the terms are versions, dates and names of APIs
- **Secrets**: none
- **ADR needed**: no new ADR; implements ADR 0131 decision 4 with the windows of ADR 0136 decision 4 and ADR 0177
  decision 6, and updates ADR 0131's Enforcement
- **New dependencies**: none
- **Deploy modes**: same in all three (build-time only)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: the docs site page only
- **Docs to update**: `apps/docs/src/docs/customers/deprecation.mdx` (new), `customers/support.mdx`,
  `programming-model.mdx`, `programming-model.ar.mdx`, `adr/0131-module-key-version-and-deprecation.mdx`,
  `apps/docs/src/config/docs.config.ts`, `packages/developer/gen/AGENTS.md`, `packages/foundation/validation/AGENTS.md`,
  `packages/foundation/contracts/AGENTS.md`, a changeset
- **Lane**: full
- **Change risk**: R1 (additive build-time contract; a warning never blocks, and the new refusals only fire on code that
  uses the new decorator)

## Acceptance criteria

- **AC-001**: THE system SHALL compute the earliest sunset of a deprecation as the next minor before 1.0, the next major
  from 1.0, and six months later for a date version (`earliestSunset`).
- **AC-002**: IF a deprecation's terms are not `{ since, sunset, replacement? }` with since and sunset both versions or
  both dates THEN THE system SHALL report `deprecation_invalid`; IF the sunset is earlier than the earliest sunset THEN
  `deprecation_window_short`.
- **AC-003**: WHEN `@Deprecated` is applied to a class of a deprecatable kind or a field of a shape kind, THE decorator
  SHALL record its terms, readable through `Deprecated.on` and `Deprecated.members`.
- **AC-004**: IF `@Deprecated` is called with terms that have a problem, or applied to a method, a class of no kind or a
  kind outside `DEPRECATABLE_KINDS`, THEN THE decorator SHALL throw a TypeError on import.
- **AC-005**: WHEN gen reads a member, THE source reader SHALL read `@Deprecated` on a class and a field and a trait's
  `createTrait` `deprecated` option, and SHALL refuse bad terms with AC-002's codes or `deprecation_not_constant`.
- **AC-006**: WHEN a member deprecates something, THE manifest SHALL list it under `deprecations` (kind, name, field,
  module, identity, since, sunset, replacement), carry `deprecated` on the action's or event's entry and
  `deprecated: true` with `x-stackra-sunset` on the field's JSON Schema; WHEN it deprecates nothing, THE manifest SHALL
  have no `deprecations` section.
- **AC-007**: WHEN an action is deprecated, `openapi.json` SHALL mark its operation `deprecated` with
  `x-stackra-sunset` and `x-stackra-replacement`.
- **AC-008**: WHEN a consumed service deprecates an action or event, THE consumer's generated client SHALL carry a
  `@deprecated` line on its descriptor, client member and event class.
- **AC-009**: WHEN a class of a member injects, listens to, extends, names as partner or composes as a trait something
  deprecated (own, a dependency's, a contracts-only dependency's or a consumed service's), THE full gen pass SHALL warn
  `deprecated_use` once per thing with the replacement in the fix, unless the class itself is deprecated.
- **AC-010**: WHEN the member's version reaches the sunset release of its own deprecation, THE full gen pass SHALL warn
  `deprecation_past_sunset`; a prerelease or a dated sunset SHALL not.
- **AC-011**: THE docs SHALL have one deprecation policy page that gathers ADR 0131 decision 4, ADR 0136 decision 4 and
  ADR 0177 decision 6 and the codes above.

## Status history

- 2026-11-26 → Clarified (audit item 8.3 re-verified on origin/main; scope from ADR 0131 decision 4)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Implementing (built in this branch, `figentra/sta-2836-deprecated-decorator`)
