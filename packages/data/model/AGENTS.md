# AGENTS — @stackra/model

<!--
Stackra file contract:
Purpose: the agent rules of @stackra/model: where code goes, the barrel, the package rules and PII.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0294; ADR 0305; ADR 0341; ADR 0380.
-->

The model kind, traits, relations and the class facets (`@Index`, `@Searchable`, `@Visibility`). Member at `packages/data/model` (`tier:lib`), in the programming
model v3.1 shape (ADR 0294, 0305). Entry `.` only; `./traits` and `./orm` are folded in (ADR 0127 2026-10-24 note).

## Where code goes

| You are writing…                                    | It goes in…                                                |
| --------------------------------------------------- | ---------------------------------------------------------- |
| The kind base (`Model`)                             | `src/core/bases/model.base.ts`                             |
| A trait                                             | `src/core/traits/<name>.trait.ts`, made with `createTrait` |
| A kind factory (`DataClass`, `ModelAddition`)       | `src/core/bases/<name>.base.ts`                            |
| A built-in data class (`PrivilegedDataClass`)       | `src/core/access/<name>.data-class.ts`                     |
| A relation decorator or a table facet               | `src/core/decorators/<name>.decorator.ts`                  |
| A value (`Link`, `Translated`)                      | `src/core/values/<name>.value.ts`                          |
| An ORM column type or embeddable schema             | `src/core/orm/<name>.type.ts`, `<name>.schema.ts`          |
| An enum, a function, a constant, a type             | `src/core/{enums,functions,constants,types}/`              |
| A port this package calls (`SubjectCipherResolver`) | `src/core/ports/<name>.port.ts`                            |
| A test                                              | `__tests__/<name>.<kind>.test.ts` beside it                |

## Entries and barrels

- `src/core/index.ts` is a stand-in barrel until gen writes the entry barrels (STA-339); add every new public file to
  it and to the export list in `src/core/__tests__/index.test.ts`.

## This package

- Models and traits hold no constructor-made state and no `#private` field: the ORM loads a row without running the
  constructor (ADR 0294 decision 27). A trait adds fields with initializers and getters only.
- Recorded events live in @stackra/events (`recordEvent`), never on the model.
- Every decorator is made with `createDecorator` and records metadata only; relation decorators are typed against
  their field. Model references inside decorators are thunks (R11).
- `Collection` and `Ref` are MikroORM's own, re-exported, so the hydrator understands them. A `Link` never has
  `unwrap()`.
- Never import @stackra/database (it depends on this package); a factory meets `Attributes<M>` through the
  `RelationSource` brand.
- Never import @stackra/rules or @stackra/iam either (both reach this package): `@Visibility` names attributes and
  relations only, and the rules, their evaluation and the query filter are IAM's (ADR 0333).
- Marker traits (`AppendOnly`, `Commentable`, `HasAttachments`) add no column; the owning package acts on them
  (ADR 0321). `HasCorrections` stays apart from `AppendOnly` so existing append-only tables keep their columns.
- Data classes (ADR 0341): `DataClass` records the four effects; their readers (AI context, support access, search,
  export) apply them. The effects of the six classes of ADR 0134 are not set here yet; only `privileged` ships.
- `@Searchable` keeps its options frozen and adds no key the caller left out; `semantic` only declares. The embedding
  and the `ai: never` refusal are @stackra/search's and gen's (ADR 0380); never read a provider here.
- `Model.global(...)` marks a model global by design (no `tenant_id`, ADR 0210 amendment); `Model.isGlobal` reads it.
- A `HasEncryptedFields({ subject })` model is never sealed under the scope's `FieldCipher`: without a bound
  `SubjectCipherResolver` the subscriber refuses it, since a shred of it would otherwise be a false erasure
  (stackra-263). The resolver's implementation is @stackra/privacy's; never import it here.
- `HasPublicId` mints with `@stackra/contracts`' `mintPublicId`; never add a second minter here (STA-1380).
- Only add a symbol a consumer imports today (the template, a package, or the registry row).
- `changeCaptureOf` is the one place that decides which fields a change may carry a value for: it always drops
  encrypted and `@Classified` fields. Never let a `CapturesChanges` option bring one back.
- `@OneToOne` (stackra-260): `(() => T, { onDelete })` on the owning side, `(() => T, (t) => t.back)` on the inverse;
  it records a `RelationDefinition` like `@ManyToOne` and reuses `ManyToOneOptions`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Imports leaving a folder use the `#core/*` alias.
- No `enum`, no `#private` fields, no parameter properties (`erasableSyntaxOnly`), no `*.stories.*`.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`pnpm turbo run <task> --filter=@stackra/model` — `build`, `typecheck`, `lint`, `test`, `test:coverage`, `format`,
`format:check`, `clean`.

## PII

| Data | Where | Handling                                                                                       |
| ---- | ----- | ---------------------------------------------------------------------------------------------- |
| None | —     | Declares models; holds no rows. Classification of a model's fields is `@Classified` per field. |
