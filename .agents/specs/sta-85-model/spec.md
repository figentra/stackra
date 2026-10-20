# Feature Specification: @stackra/model, client-safe models, relations, scopes, state machines and traits

**Feature Branch**: `figentra/sta-85-model-spec`

**Created**: 2026-10-20

**Status**: Draft <!-- Draft → Clarified → Planned → Ready → Implementing → Verified, or Abandoned / Superseded; spec-gate ci checks the artifacts each stage needs -->

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

<!-- Folder: .agents/specs/sta-n-<slug>/, named by the Linear key below (ADR 0120 D1). -->

**Linear**: STA-85

**Linear project**: Data layer (W2.1, STA-55)

**Clarifications status**: pending <!-- /speckit.clarify sets this to "complete" when nothing is open -->

**Input**: User description: "Draft the specify-stage spec for `packages/data/model` (roadmap W2.1, STA-85): `@Model`, fields on
`@stackra/validation`, relations as metadata, scopes, eager loads, a state machine, `createTrait` and the trait registry; it
imports no ORM (ADRs 0097, 0096, 0046, 0082)."

## Impact _(mandatory, answer every line before /speckit.clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/data/model (new). Read by packages/data/database (STA-86) and developer/gen (STA-92); traits from security/tenancy, runtime/outbox, data/search, data/content and others register on its registry later
- **Cross-service events**: none
- **Tenancy and data**: none in this package. It declares model metadata only; no table, no migration. `HasTenant` is owned by `@stackra/tenancy` (ADR 0096) and registers on this package's trait registry when that package lands
- **Secrets**: none
- **ADR needed**: no (ADRs 0097, 0096, 0046 and 0116 decide it)
- **New dependencies**: none (workspace packages `@stackra/validation`, `@stackra/container`, `@stackra/contracts`)
- **Deploy modes**: same in all three. Metadata only, client-safe, no network (ADR 0076)
- **Lane**: full (roadmap W2.1)
- **Change risk**: R2 (a new package with a public contract that every data package builds on)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Declare a model once and use its shape on server and client (Priority: P1)

A module author writes a `@Model` class whose fields use `@stackra/validation` decorators. The same class gives a form, an API
client and an admin resource its typed shape without importing an ORM, and gives `@stackra/database` and gen the metadata to
persist it (ADR 0097 decisions 1 and 3).

**Why this priority**: Every data package and gen read this metadata; nothing in Phase 2 or 3 starts without it.

**Independent Test**: A `User` model is imported in a browser-like test with no `@mikro-orm/*` in the module graph; its
metadata lists fields, types, nullability and the compiled Zod schema.

**Acceptance Scenarios**:

1. **Given** `@Model({ table: "users", prefix: "user" }) class User` with `@Str() @Email() email`, **When** its metadata is read, **Then** it reports the table, the public-id prefix, the `email` field and the same Zod schema `@stackra/validation` compiled.
2. **Given** the model, **When** the bundle graph of a client entry is inspected, **Then** no `@mikro-orm/*` module is present.
3. **Given** a model with no delete policy, **When** its metadata is read, **Then** the policy is `archive` (ADR 0046 decision 3).

---

### User Story 2 - Declare relations as metadata (Priority: P1)

The author declares `@BelongsTo`, `@HasOne`, `@HasMany`, `@ManyToMany` (with a pivot) and morph relations. They are plain
metadata that `@stackra/database` and gen turn into an `EntitySchema`; nothing is resolved at import time (ADR 0097 decisions 1
and 4).

**Why this priority**: Without relations no realistic model can be persisted or loaded.

**Independent Test**: Two models referencing each other (`Post` belongs to `User`, `User` has many `Post`) import in either
order and report both sides of the relation.

**Acceptance Scenarios**:

1. **Given** `Post.@BelongsTo(() => User) author`, **When** metadata is read, **Then** it names the target, the foreign key and the inverse side.
2. **Given** a `@ManyToMany` with a pivot, **When** metadata is read, **Then** the pivot table and its extra columns are listed.
3. **Given** a relation to a model in another module, **When** it is declared as a normal relation, **Then** a diagnostic points to `@Link` (ADR 0104 decision 1).

---

### User Story 3 - Compose behaviour with traits (Priority: P1)

A package author creates a trait with `createTrait` and a model opts in (`@Model({ traits: [HasTimestamps] })` or the
documented form). The registry composes traits from many packages on one class; this package ships `HasTimestamps` (ADR 0096
decisions 1, 2 and 4).

**Why this priority**: Timestamps, delete policy, tenancy, audit, search and content all arrive as traits.

**Independent Test**: A test trait adding a field and a hook, plus `HasTimestamps`, compose on one model; the registry lists both
with their owning package.

**Acceptance Scenarios**:

1. **Given** `createTrait({ name: "HasTimestamps", … })`, **When** a model uses it, **Then** the model gains `createdAt` and `updatedAt` fields in its metadata and schema.
2. **Given** a trait named `Timestamps` (no grammar prefix), **When** it is created, **Then** creation fails with an STK diagnostic naming the grammar (ADR 0096 decision 2).
3. **Given** two traits that add the same field, **When** both are applied, **Then** composition fails with an STK conflict diagnostic.

---

### User Story 4 - Declare scopes, eager loads, list rules and audience visibility (Priority: P2)

The author declares named scopes (`@Scope`), default eager loads, the filters, sorts and includes a list action accepts, and
per-audience hidden or visible fields. The database executes them; actions and gen read them (ADR 0097 decisions 4 and 5.1,
ADR 0095 decision 6).

**Independent Test**: A model's metadata lists its scopes, eager loads and list allow-lists; serializing an instance for
`agent` omits fields hidden from `agent`.

**Acceptance Scenarios**:

1. **Given** list rules allowing filter `status` and sort `createdAt` declared on the model (decorator names settled in the plan), **When** list metadata is read, **Then** only those keys are allowed.
2. **Given** a field visible only to `admin` (`@Visible({ audience: ["admin"] })`), **When** the model is serialized for `agent`, **Then** the field is absent.

---

### User Story 5 - Guard state transitions with a declared state machine (Priority: P2)

The author declares states and transitions on a model field. Calling a transition that is not allowed from the current state
fails with an STK error, and the machine is metadata that gen and the console can draw (ADR 0097 decision 1, ADR 0116 decision 3).

**Independent Test**: An `Order` with `draft → placed → shipped` refuses `draft → shipped`.

**Acceptance Scenarios**:

1. **Given** an order in `draft`, **When** `ship` is called, **Then** an STK invalid-transition error names the state and transition.
2. **Given** an order in `draft`, **When** `place` is called, **Then** the state is `placed` and the guard ran.

---

### User Story 6 - Declare field storage and translations (Priority: P3)

The author marks a field `@Stored(...)` to say where and how it is persisted, or `@Translatable` for per-locale values (ADR 0097
decision 5.2).

**Independent Test**: Metadata of a model with a `@Translatable title` lists it as localized with its storage.

**Acceptance Scenarios**:

1. **Given** `@Translatable() title`, **When** metadata is read, **Then** the field is localized and its storage follows the clarified rule [NEEDS CLARIFICATION: C16 — recommended: the `@Translatable` field decorator owns storage; the content `Translatable` trait only bundles it].

### Edge Cases

- A model class extends another model: fields, relations and traits inherit; the child may override a field with a diagnostic.
- Circular imports between models: relation targets are thunks, read lazily.
- A model declares a public-id prefix already registered by another model: registration fails with an STK diagnostic (ADR 0082 decision 2) [NEEDS CLARIFICATION: DA9 — recommended: 2–6 lowercase letters, `_` separator, uniqueness checked in the gen manifest across installed packages].
- A model declares delete policy `hard`: allowed, and visible in metadata for review (ADR 0046 decision 3).
- A model opts into `soft` or `archive`: the semantics are those the owner settles [NEEDS CLARIFICATION: DA7 — recommended: archive hides from default lists and is kept until tenant deletion; soft sets `deleted_at`, restorable for 30 days, then pruned].
- A model opts into `Versionable`: the meaning is the one the owner settles [NEEDS CLARIFICATION: DA8 — recommended: optimistic concurrency with a row version and a conflict on mismatch; history belongs to `HasRevisions` or audit].

## Requirements _(mandatory)_

### Functional Requirements

EARS wording (ADR 0120 D18).

- **FR-001**: The package shall import no `@mikro-orm/*`, no Node-only module and no `encore.dev`, so it is safe in client bundles (ADR 0097 decisions 1 and 2, ADR 0124 decision 3).
- **FR-002**: The package shall provide `@Model(options)` declaring at least the table name, the public-id prefix, the delete policy and the traits.
- **FR-003**: Model fields shall be declared with `@stackra/validation` decorators, and the model's schema shall be the one validation compiles (ADR 0097 decision 1, ADR 0095 decision 3).
- **FR-004**: Every model's primary key shall be one UUIDv7, and its public id shall be its registered prefix plus the base32 encoding of that UUIDv7, encoded and decoded with the codec in `@stackra/contracts` (ADR 0082 decisions 1 and 2, ADR 0046 decision 1, ADR 0117 decision 1).
- **FR-005**: When a model declares no delete policy, its policy shall be `archive`; `soft` and `hard` shall be explicit (ADR 0046 decisions 2 and 3).
- **FR-006**: The package shall provide relation decorators `@BelongsTo`, `@HasOne`, `@HasMany`, `@ManyToMany` with pivots, and morph relations, recorded as metadata with lazy targets (ADR 0097 decisions 1 and 4).
- **FR-007**: The package shall provide `@Scope` for named query scopes and a declaration of default eager loads, as metadata the database executes (ADR 0097 decisions 1 and 4).
- **FR-008**: The package shall let a model declare the filters, sorts and includes its list actions accept (ADR 0097 decision 5.1, ADR 0105 decision 1).
- **FR-009**: The package shall provide `@Stored` and `@Translatable` field-storage declarations (ADR 0097 decision 5.2) [NEEDS CLARIFICATION: C16 — recommended: field decorator owns storage; the content trait bundles it].
- **FR-010**: The package shall expose per-audience hidden and visible fields through the `@stackra/validation` serializer, with audiences `public`, `app`, `admin` and `agent` (ADR 0097 decision 4, ADR 0095 decision 6).
- **FR-011**: The package shall provide a state-machine declaration on a model field, with guarded transitions; if a transition is not allowed from the current state, then it shall fail with an STK error (ADR 0097 decision 1).
- **FR-012**: The package shall provide `createTrait` and the trait registry, so traits owned by many packages compose on one class (ADR 0096 decision 1 and Consequences, ADR 0117 decision 6).
- **FR-013**: When a trait is created, its name shall match `Has*`, `*able`, `As*` or `InteractsWith*`, or be `SoftDeletes`; otherwise creation shall fail with an STK diagnostic (ADR 0096 decisions 2 and 3).
- **FR-014**: If two traits applied to one model add the same field or hook slot without a declared merge, then composition shall fail with an STK diagnostic.
- **FR-015**: The package shall ship the `HasTimestamps` trait (ADR 0096 decision 4); the other traits in the 0096 table are owned and shipped by their packages, including `HasCustomFields` by `@stackra/content` (ADR 0116 decision 5).
- **FR-016**: The trait contract shall let a trait add fields, relations, scopes, filters, lifecycle hooks and model options, so that the database can run trait hooks as a MikroORM subscriber without this package importing MikroORM (ADR 0097 decision 4).
- **FR-017**: The package shall expose a read-only metadata API (fields, relations, scopes, list rules, state machines, traits, options) that `@stackra/database` and gen read to emit MikroORM `EntitySchema` definitions and the gen manifest (ADR 0097 decisions 3 and 5.4).
- **FR-018**: A relation across module boundaries shall be declared with `@Link`, not an ordinary relation (ADR 0104 decisions 1 and 5).
- **FR-019**: All decorators shall be legacy decorators on the `@stackra/container` metadata store, with no `reflect-metadata` and no `define*()` API (ADR 0094 decisions 1 and 5).
- **FR-020**: The package shall publish a types-only `./contracts` entry (model, field, relation, trait and state-machine metadata types) with no runtime imports (ADR 0117 decision 2).
- **FR-021**: The package's entries and layout shall follow the layout chosen for every package [NEEDS CLARIFICATION: FW1 — recommended: (a) entries first: `contracts`, `core`, `testing`].

### Key Entities

- **Model**: a decorated class with a table, a public-id prefix, a delete policy, fields, relations and traits.
- **Field**: a validation-decorated property plus storage options.
- **Relation**: a metadata record linking two models (kind, target thunk, keys, pivot).
- **Trait**: a named, reusable bundle of fields, relations, scopes and hooks created with `createTrait`.
- **Trait registry**: the index of every trait and its owning package; composes traits on a class.
- **State machine**: states, transitions and guards declared on one field.
- **Model metadata**: the read-only description gen and the database consume.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A client-environment test imports a model and its metadata with no `@mikro-orm/*` module loaded.
- **SC-002**: Every trait in the ADR 0096 table owned by this package (`HasTimestamps`) ships with tests; the grammar check rejects a misnamed trait in a test.
- **SC-003**: For each relation kind there is a test that its metadata is complete enough for `@stackra/database` to emit an `EntitySchema` (verified by a fixture the database spec reuses).
- **SC-004**: A state-machine test refuses every transition not declared.
- **SC-005**: `pnpm verify` is green with the package added.

## Glossary

- **Model**: the single declaration of a persisted shape, used on server and client.
- **Trait**: reusable class behaviour; named by the 0096 grammar (`Has*` owns data, `*able` is a capability, `As*` is a role, `InteractsWith*` helps a non-model).
- **Delete policy**: `archive` (default), `soft` or `hard`.
- **Public id**: entity prefix plus base32 of the UUIDv7 key; the only id that leaves a service.
- **EntitySchema**: MikroORM's non-decorator mapping, emitted by gen from model metadata.
- **Link**: a relation between models of different modules, with its own pivot (ADR 0104).
- **Scope**: a named, reusable query constraint declared on the model.

## Assumptions

- `@stackra/validation` (STA-79) and `@stackra/container` are merged before the plan starts (roadmap W2.1 depends on W1.3).
- The public-id codec lives in `@stackra/contracts` (ADR 0125 decision 2); this package registers prefixes only.
- Execution of scopes, filters, eager loads, pagination and trait hooks is `@stackra/database`'s job (STA-86).
- The nestjs-orm reference (`archive/monorepo-main/packages/infra/orm`) is used for its feature list, not its code; Medusa DML is background only.

## Open items

- [NEEDS CLARIFICATION: FW1 — recommended: (a) entries-first package layout]
- [NEEDS CLARIFICATION: DA7 — recommended: (a) archive and soft delete stay distinct, with the stated retention]
- [NEEDS CLARIFICATION: DA8 — recommended: (a) `Versionable` is optimistic concurrency only]
- [NEEDS CLARIFICATION: DA9 — recommended: (a) lowercase Crockford base32, `_` separator, 2–6 letter prefixes unique in the gen manifest]
- [NEEDS CLARIFICATION: C16 — recommended: the `@Translatable` field decorator owns storage; the content `Translatable` trait bundles it]
