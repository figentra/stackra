# Feature Specification: gen's check codes named as gen emits them, and built checks no longer marked planned

**Feature Branch**: `figentra/sta-2068-docs-check-names`

**Created**: 2026-11-03

**Status**: Draft <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-2068

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: User description: "Work package wp-22 of the gen coverage path: ADR 0294 names the gen check
`two_kinds_in_file` where gen emits `two_declarations_in_file` (G-210), and the rules and ADR Enforcement sections
still mark as planned gen checks that gen already refuses with (G-211). Fix the docs, and add a test that fails when a
doc names a code as built that gen does not have."

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: apps/docs (ADR pages 0263, 0294, 0305 and 0307: their Enforcement sections only)
- **Services touched**: none
- **Packages touched**: packages/developer/gen (one new test file, and a `test` task override in its own
  `turbo.jsonc` so the test reruns when the docs it reads change)
- **Public contract change**: none
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no (Enforcement sections record what is built; no decision changes)
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `apps/docs/src/docs/adr/0294-programming-model-v3-grammar-folders-identities-and-naming.mdx`,
  `apps/docs/src/docs/adr/0263-di-stays-and-gen-writes-the-wiring.mdx`,
  `apps/docs/src/docs/adr/0305-programming-model-v3-1-names-partners-files-and-class-components.mdx`,
  `apps/docs/src/docs/adr/0307-panel-v3-1-resource-tables-placements-widgets-slots-and-dashboards.mdx`;
  `.agents/rules/ai-tools.md` and `.agents/rules/naming-and-casing.md`, and their projection in `AGENTS.md`
- **Lane**: chore (docs and a test, no behaviour change; the spec exists because the work package asks for one)
- **Change risk**: R0 (docs and tests only)

## Glossary _(full lane)_

- **Gen code**: the snake_case `code` of a `GenError` (`packages/developer/gen/src/core/types/gen-error.type.ts`).
  `code` is a plain `string`, so the set of codes is the set of quoted snake_case literals in gen's non-test source.
- **Built row**: a line of an Enforcement section that starts with `automated —` (the form ADR 0305's note of
  2026-10-27 already uses), naming what checks the rule today.
- **Planned row**: a line that starts with `planned —`, naming a check that does not exist yet and its issue.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A reader finds the code gen prints (Priority: P1)

An author who hits `two_declarations_in_file` searches the docs for it and finds the ADR row that names it; nothing
names a code gen never prints.

**Why this priority**: G-210 sends a reader to a name that does not exist in gen.

**Independent Test**: `git grep two_kinds_in_file` finds nothing.

**Acceptance Scenarios**:

1. **Given** ADR 0294's Enforcement section, **When** a reader looks for the one-declaration check, **Then** it reads
   `two_declarations_in_file`.

---

### User Story 2 - The docs say which gen checks are built (Priority: P1)

A reader or an agent reading a rule or an ADR's Enforcement section sees each gen check that exists on an
`automated —` row with its code, and only the checks gen does not have on `planned —` rows.

**Why this priority**: G-211: a planned row for a built check makes agents re-plan or re-build it, and makes review
treat a refused shape as allowed.

**Independent Test**: the new test reads every `automated —` row of the touched Enforcement sections and finds each
backticked code in gen's source.

**Acceptance Scenarios**:

1. **Given** ADR 0294 Enforcement, **When** read, **Then** `kind_suffix_mismatch`, `kind_class_name`,
   `two_declarations_in_file`, `kind_unregistered_base`, the six `shape_*` checks, `action_handle_signature`,
   `identity_changed`, `identity_collision`, `i18n_key_missing` and `secret_name_missing` sit on an `automated —` row,
   and the `X$Check` assertions, the link check of decision 28, the zod catalog entry and `refresh_on_domain_event`
   stay planned.
2. **Given** ADR 0305 Enforcement, **When** read, **Then** `site_cache_reads_caller`, `two_declarations_in_file`,
   `partner_mismatch`, `override_duplicate`, `identity_collision`, `empty_module`, `event_base_abstract` and
   `secret_name_missing` sit on an `automated —` row, and `secret_on_wire`, `integration_placeholder_unknown` and the
   action surface checks stay planned.
3. **Given** ADR 0307 Enforcement, **When** read, **Then** `sort_not_indexed`, `filter_not_indexed` and
   `builder_impure` sit on an `automated —` row and the rest of the list stays planned.
4. **Given** ADR 0263 Enforcement, **When** read, **Then** the module cycle (`module_cycle`), the injection of a class
   its module does not export (`sibling_not_exported`) and a constructor parameter not typed with a class
   (`token_not_a_class`) sit on an `automated —` row, and the policy verb with no permission and the `pnpm validate`
   and conformance items stay planned.
5. **Given** the rules `ai-tools` and `naming-and-casing` and their projection in `AGENTS.md`, **When** read, **Then**
   `client_tool_collision`, `prefill_tool_off` and `anchor_undeclared`, and `kind_class_name` and `identity_changed`,
   are named as automated, and the other items of those rows stay planned.

---

### User Story 3 - A wrong code in a built row fails the build (Priority: P2)

A later change that names a code as built which gen does not emit (a typo, a rename, or a check not yet written)
fails `@stackra/gen`'s tests.

**Why this priority**: keeps G-210 from coming back.

**Independent Test**: the test passes on the corrected docs; adding a fake code to a built row makes it fail with that
code and the file in the message.

**Acceptance Scenarios**:

1. **Given** a built row naming `` `no_such_code` ``, **When** the gen tests run, **Then** the test fails and names
   `no_such_code` and its file.

---

### Edge Cases

- **EC-01**: A built row names something that is not a gen code (a lint rule `one-declaration-per-file`, a file name
  `check-conventions.function.ts`): only backticked snake_case tokens count, and kebab-case or dotted names are
  skipped.
- **EC-02**: A row wraps over several lines: a row runs until the next list item, the next blank line or the next
  heading.
- **EC-03**: A gen code used only as a constant or template string elsewhere still counts, since `code` is a plain
  string; the test only checks that the documented name exists in gen, not where it is raised.
- **EC-04**: An Enforcement section with no built row checks nothing and passes.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE docs SHALL name the one-declaration-per-file gen check `two_declarations_in_file`, and no file in
  the repository SHALL contain `two_kinds_in_file`.
- **FR-002**: WHEN gen's source emits a check code that an Enforcement row of ADR 0263, 0294, 0305 or 0307, or of the
  rules `ai-tools` or `naming-and-casing`, lists as planned THE row SHALL move the code to an `automated —` row that
  names it.
- **FR-003**: WHEN a listed check has no code in gen's source THE row SHALL stay `planned —` with its issue.
- **FR-004**: THE test `gen-codes-documented.test.ts` SHALL fail when an `automated —` row of a checked document names
  a backticked snake_case code that is no quoted literal of gen's non-test source, naming the code and the file.
- **FR-005**: THE `AGENTS.md` projection SHALL equal what `tools/scripts/agents-sync.mjs` writes from the edited rules.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN `git grep two_kinds_in_file` runs THE repository SHALL return nothing.
- **AC-002**: WHEN the gen tests run THE test SHALL find every code named on a built row in gen's source.
- **AC-003**: WHEN a reader reads the touched Enforcement rows THE rows SHALL mark as planned only checks that gen
  does not have.

## Success Criteria _(mandatory)_

- **SC-001**: `git grep two_kinds_in_file` is empty — verified by: manual (and the test asserts it for the checked
  documents)
- **SC-002**: `gen-codes-documented.test.ts` passes on ci-box and fails on a planted fake code — verified by: unit
- **SC-003**: `pnpm verify` (format, lint, the gen tests, validate with the agents-sync check) is green on ci-box —
  verified by: manual

## Out of scope

- Building any planned check (the STA-340, STA-339, STA-1631 and STA-1637 items that stay planned).
- The reverse direction (a planned row naming a code gen has): each check package moves its own row when it lands
  (gen coverage path, point 5); the test does not refuse it, so in-flight packages are not blocked.
- Enforcement sections of ADRs other than 0263, 0294, 0305 and 0307, and rules other than `ai-tools` and
  `naming-and-casing`; the audit names no other stale row.
- The `http-conventions` rule row: none of its five checks (endpoint collision, method by kind, query risk, `cache`
  on an action, precondition on a query) has a gen code yet, so it stays planned.
- gen's docs-site emitter and `templates/docs-site/**` (STA-2026).

## Assumptions

- A quoted snake_case literal in gen's non-test source is a fair stand-in for "gen emits this code": `GenError.code`
  is a `string`, and every refusal passes its code as such a literal (`code: "x"` or a helper's first argument).
- `token_not_a_class` ("the parameter is not typed with a class") is the check ADR 0263 calls an unresolved
  constructor parameter type and a string injection token; `sibling_not_exported` is the injection of a non-exported
  class. A policy verb with no permission has no gen code (STA-2045 owns policies) and stays planned.
- ADR 0307's `slot_unknown` and `placement_duplicate` are not gen's `slot_undeclared` and `slot_fill_duplicate`
  (which check slot fills against the shell's manifest, ADR 0307 slots): they stay planned, unrenamed, since naming
  them the same would be a decision this docs package does not make.
- The `stackra/one-declaration-per-file` lint rule exists in `@stackra/coding-standard`, so ADR 0305's row may name it
  as automated; the test skips it (kebab-case).

## Amendments

None.

## Status history

- 2026-11-03 · — → Draft · Claude (STA-2068 session) · created
