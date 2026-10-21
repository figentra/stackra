# Feature Specification: @stackra/validation, decorators compiled to one Zod schema, plus an output serializer

**Feature Branch**: `figentra/sta-79-validation-spec`

**Created**: 2026-10-20

**Status**: Draft <!-- Draft → Clarified → Planned → Ready → Implementing → Verified, or Abandoned / Superseded; spec-gate ci checks the artifacts each stage needs -->

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

<!-- Folder: .agents/specs/sta-n-<slug>/, named by the Linear key below (ADR 0120 D1). -->

**Linear**: STA-79

**Linear project**: Foundation kernel (W1.3, STA-54)

**Clarifications status**: pending <!-- /speckit.clarify sets this to "complete" when nothing is open -->

**Input**: User description: "Draft the specify-stage spec for `packages/foundation/validation` (roadmap W1.3, STA-79): Laravel-style
rule decorators and input transforms compiled once per class to one cached Zod object, `X.parse()` returning an instance or
an STK `ValidationError`, and an output serializer with audiences (ADR 0095)."

## Impact _(mandatory, answer every line before /speckit.clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/foundation/validation (new). Built on by packages/data/model (STA-85); its async-rule driver contract is implemented by packages/data/database (STA-86)
- **Cross-service events**: none
- **Tenancy and data**: none. The package stores nothing; `@Exists` and `@Unique` only declare a rule that a driver answers
- **Secrets**: none
- **ADR needed**: no (ADR 0095 decides the package; 0094 and 0117 bound it)
- **New dependencies**: `zod` in a pnpm catalog (exact pin, dependency-steward)
- **Deploy modes**: same in all three. Pure computation, no network, no licence check (ADR 0076); client-safe, so it runs in browser, React Native and Node
- **Lane**: full (roadmap W1.3)
- **Change risk**: R2 (a new package with a public contract and a new dependency)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Declare an input class once and parse untrusted input with it (Priority: P1)

A package or service author decorates the fields of an input class with short rules (`@Str`, `@Email`, `@Min`, `@Optional`, …)
and calls `CreateUser.parse(body)`. They get a typed `CreateUser` instance, or a `ValidationError` with an STK code and one
issue per failing field. The same class drives actions, forms, wire types, OpenAPI, MCP tool schemas and the IR, because they
all read the one compiled Zod schema (ADR 0095 decisions 2, 3 and 5).

**Why this priority**: Every later package (model, actions, forms, gen) needs exactly this. Without it nothing else in the
data layer can start.

**Independent Test**: A test class with one field per shorthand decorator parses valid input to an instance and rejects each
invalid case with the documented issue.

**Acceptance Scenarios**:

1. **Given** a class with `@Str() @Email() email` and `@Int() @Min(18) age`, **When** `parse({ email: "a@b.co", age: 20 })` runs, **Then** it returns an instance of the class with those values.
2. **Given** the same class, **When** `parse({ email: "x", age: 3 })` runs, **Then** it throws a `ValidationError` with an STK code and two issues, one per path.
3. **Given** the class has been parsed once, **When** it is parsed again, **Then** the Zod schema is not rebuilt (the cached object is reused).

---

### User Story 2 - Normalise input with transforms in the same schema (Priority: P2)

An author adds `@Trim`, `@Lowercase`, `@ToInt`, `@ToBoolean`, `@ToDate` or `@Transform(fn)` to a field. Parsing applies the
transform and then the rules, in one pass, inside the same Zod schema (ADR 0095 decision 5).

**Why this priority**: Form and query-string input arrives as strings; without transforms every caller re-implements coercion.

**Independent Test**: A class with `@Trim() @Lowercase() @Email() email` and `@ToInt() @Min(1) page` parses `"  A@B.CO "` and `"2"`.

**Acceptance Scenarios**:

1. **Given** `@Trim() @Lowercase() @Email() email`, **When** `"  A@B.CO "` is parsed, **Then** the instance holds `"a@b.co"`.
2. **Given** `@ToInt() page`, **When** `"abc"` is parsed, **Then** a `ValidationError` names `page`.

---

### User Story 3 - Serialize an instance for one audience (Priority: P2)

An author marks fields `@Hidden`, `@Visible({ audience })`, `@Expose`, `@Cast` or `@Format`, and serializes an instance for
`public`, `app`, `admin` or `agent`. A field not visible to an audience is absent from that output, so a field hidden from
`agent` never reaches a prompt (ADR 0095 decision 6).

**Why this priority**: The agent audience is a data-leak boundary; it must exist before any AI tool reads records.

**Independent Test**: One class serialized for each of the four audiences produces four different, documented key sets.

**Acceptance Scenarios**:

1. **Given** `@Hidden() passwordHash` and `@Visible({ audience: ["admin"] }) internalNote`, **When** the instance is serialized for `agent`, **Then** neither key is present.
2. **Given** `@Format(...)` on a date, **When** serialized for `app`, **Then** the value is the formatted string.

---

### User Story 4 - Declare database-backed rules without importing a database (Priority: P3)

An author writes `@Unique({ model, field })` or `@Exists({ model, field })`. `@stackra/validation` records the rule and calls a
rule driver through a contract; `@stackra/database` provides the server driver (ADR 0095 decision 4). With no driver
registered, the behaviour is the one chosen in Open items.

**Why this priority**: Needed by real forms, but the driver ships with the database package in W2.2.

**Independent Test**: With a fake driver from the testing entry, `parseAsync` reports a uniqueness failure; `parse` (sync)
refuses a class that has async rules with a clear STK error.

**Acceptance Scenarios**:

1. **Given** a fake rule driver that reports `email` taken, **When** `await X.parseAsync(input)` runs, **Then** a `ValidationError` names `email`.
2. **Given** no rule driver is registered, **When** a class with `@Unique` is parsed, **Then** behaviour follows the clarified default [NEEDS CLARIFICATION: C36 — proposed: skip async rules on the client with a dev-mode warning; fail closed on the server without a driver].

---

### User Story 5 - Escape hatch for anything the shorthands do not cover (Priority: P3)

An author writes `@Field(z.string().regex(...))` and it composes with the shorthands and transforms on the same class (ADR 0095
decision 2).

**Independent Test**: A class mixing `@Field(z…)` and shorthands compiles to one schema that passes and fails as expected.

**Acceptance Scenarios**:

1. **Given** `@Field(z.string().regex(/^[A-Z]{3}$/)) code`, **When** `"abc"` is parsed, **Then** a `ValidationError` names `code`.

### Edge Cases

- A subclass adds fields to a decorated parent: the child's schema extends the parent's, and the parent's cache is untouched.
- Two rule decorators conflict on one field (`@Int` and `@Str`): compiling the class fails with an STK diagnostic, not at parse time.
- `@Nested(Child)` and `@ArrayOf(Child)` with a cycle (A → B → A): compiled lazily, no infinite recursion.
- `@Optional` with `@Default`: absent input takes the default; explicit `null` follows the documented rule.
- Unknown input keys are stripped, not kept, unless the class opts in.
- A `@Transform(fn)` that throws becomes a `ValidationError` issue, never an uncaught error.
- Validation messages are STK codes plus parameters, not English sentences, so `@stackra/i18n` can translate them [NEEDS CLARIFICATION: C36 — proposed: issues carry an STK code and params; i18n keys are derived from the code].

## Requirements _(mandatory)_

### Functional Requirements

EARS wording (ADR 0120 D18).

- **FR-001**: The package shall be client-safe: it shall import no ORM, no Node-only module and no `encore.dev` (ADR 0095 decision 1, ADR 0124 decision 3).
- **FR-002**: The package shall provide the rule decorators `@Str`, `@Min`, `@Max`, `@Email`, `@Int`, `@Between`, `@Enum`, `@Date`, `@After`, `@ArrayOf`, `@Nested`, `@Uuid`, `@Optional` and `@Default`, and the escape hatch `@Field(z…)` (ADR 0095 decision 2).
- **FR-003**: Each rule decorator shall map to exactly one documented Zod construct (ADR 0095 Consequences).
- **FR-004**: When a decorated class is first used, the package shall compile its fields to one `z.object` and cache it per class; later uses shall reuse the cached schema (ADR 0095 decision 3).
- **FR-005**: The package shall expose the compiled schema of a class so that model, actions, forms, gen, OpenAPI, MCP tool schemas and the IR read the same schema; Zod shall be the only validation engine (ADR 0095 decision 3).
- **FR-006**: The package shall provide the input transforms `@Trim`, `@Lowercase`, `@ToInt`, `@ToBoolean`, `@ToDate` and `@Transform(fn)`, compiled into the same schema and applied before the field's rules (ADR 0095 decision 5).
- **FR-007**: When `X.parse(input)` succeeds, it shall return an instance of `X`; when it fails, it shall throw a `ValidationError` carrying an STK code and one issue per failing path (ADR 0095 decision 5).
- **FR-008**: Where a class declares an async rule, the package shall offer `X.parseAsync(input)`, and `X.parse` shall refuse that class with an STK error.
- **FR-009**: The package shall provide `@Exists` and `@Unique`, which record the rule and call a validation rule driver through a contract in the package's `./contracts` entry; the package shall not implement a database driver (ADR 0095 decision 4, ADR 0117 decision 2).
- **FR-010**: If no rule driver is registered, then a class with `@Exists` or `@Unique` shall behave as the clarified default [NEEDS CLARIFICATION: C36 — proposed: skip and warn in development on the client; fail closed on the server].
- **FR-011**: The package shall provide the serializer decorators `@Hidden`, `@Visible({ audience })`, `@Expose`, `@Cast` and `@Format`, kept separate from validation (ADR 0095 decision 6).
- **FR-012**: When an instance is serialized for an audience, the serializer shall omit every field not visible to that audience. The audiences shall be exactly `public`, `app`, `admin` and `agent` (ADR 0095 decision 6).
- **FR-013**: The decorators shall be legacy decorators writing to the `@stackra/container` metadata store, with no `reflect-metadata` and no `define*()` factory (ADR 0094 decisions 1 and 5, ADR 0005).
- **FR-014**: The package shall own its decorators, built with the container's `createDecorator` (ADR 0117 decision 6).
- **FR-015**: The package shall publish a types-only `./contracts` entry holding the `ValidationError` shape, issue shape, audience type and rule-driver contract, with no runtime imports (ADR 0117 decision 2).
- **FR-016**: The package shall not depend on `class-validator` or `class-transformer` (ADR 0095 decision 7; enforced by `FORBIDDEN_DEPENDENCIES`).
- **FR-017**: The package shall ship a testing entry with a fake rule driver and helpers to assert a class's compiled schema.
- **FR-018**: The package's entries and folder layout shall follow the package layout chosen for every package [NEEDS CLARIFICATION: FW1 — recommended: (a) entries first (`contracts`, `core`, `testing`), `config/` outside `src`].
- **FR-019**: The STK error codes the package raises shall fit the shared error kinds of `@stackra/contracts` so gen can map them to API errors [NEEDS CLARIFICATION: FW7 — recommended: (a) error kinds with STK codes in `@stackra/contracts`; `ValidationError` is kind `invalidArgument`].

### Key Entities

- **Compiled schema**: the cached `z.object` of one class; the single source for every consumer of the shape.
- **Rule**: one field constraint declared by a decorator; sync (Zod) or async (driver-backed).
- **Transform**: an input normalisation compiled into the schema before rules.
- **ValidationError**: the STK-coded error with an issue list (path, code, params).
- **Audience**: `public`, `app`, `admin` or `agent`; selects which fields the serializer emits.
- **Rule driver**: the contract that answers `@Exists` and `@Unique`; implemented by `@stackra/database`.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Every decorator in FR-002, FR-006 and FR-011 has at least one test proving its documented Zod construct or serializer behaviour (ADR 0095 Enforcement).
- **SC-002**: A second `parse` of a class does no schema compilation, shown by a test that counts compilations.
- **SC-003**: The package builds and its tests pass with no Node-only import, checked by `boundaries.jsonc`, and it runs in a browser-like test environment.
- **SC-004**: For one sample class, the schema read by a form, an action input and the IR is the same object (identity check).
- **SC-005**: Coverage meets the package target [NEEDS CLARIFICATION: TS3 — recommended: 90% lines and functions, 80% branches for validation].
- **SC-006**: `pnpm verify` is green with the package added.

## Glossary

- **Shorthand decorator**: a Laravel-style rule decorator such as `@Email` that maps to one Zod construct.
- **Escape hatch**: `@Field(z…)`, a raw Zod schema on one field.
- **STK code**: the Stackra diagnostics code prefix (owner decision X3) used by every error.
- **Audience**: who receives serialized output; `agent` is any AI model or tool consumer.
- **Rule driver**: an injected implementation that answers async rules against a data store.
- **Client-safe**: importable in browser and React Native bundles; no ORM, Node built-ins or server SDKs.

## Assumptions

- `@stackra/contracts`, `@stackra/support` and `@stackra/container` (W1.1, W1.2) are merged before this plan starts (roadmap dependency).
- Zod is the version the catalog pins; Standard Schema compatibility comes from Zod itself.
- The IR's SchemaIR-to-Zod conversion (ADR 0092) consumes this package's schema and is out of scope here.
- Form adapters (react-hook-form, HeroUI) live in `@stackra/ui/form` (ADR 0270; `@stackra/forms` is dropped) and the apps, not here.

## Open items

- [NEEDS CLARIFICATION: C36 — proposed: client skips `@Exists`/`@Unique` with a dev warning, server fails closed without a driver; issues carry STK code + params that i18n translates]
- [NEEDS CLARIFICATION: FW1 — recommended: (a) entries-first package layout]
- [NEEDS CLARIFICATION: FW7 — recommended: (a) error kinds with STK codes in `@stackra/contracts`]
- [NEEDS CLARIFICATION: TS3 — recommended: 90/80 coverage for validation]
