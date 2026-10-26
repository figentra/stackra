# AGENTS — @stackra/validation

Shapes, field rules and the schema registry. Member at `packages/foundation/validation` (`tier:lib`), in the
programming model v3.1 shape (ADR 0294, 0305). Entry `.` only.

## Where code goes

| You are writing…                               | It goes in…                                 |
| ---------------------------------------------- | ------------------------------------------- |
| The `Schema` kind base                         | `src/core/bases/schema.base.ts`             |
| A shipped shape (`CursorInput`, `TableInput`)  | `src/core/schemas/<name>.schema.ts`         |
| Its schema (`X$` stand-in) or a constant       | `src/core/constants/<name>.constant.ts`     |
| A field decorator                              | `src/core/decorators/<name>.decorator.ts`   |
| A helper generated code imports, or a function | `src/core/functions/<name>.function.ts`     |
| A type                                         | `src/core/types/<name>.type.ts`             |
| A test                                         | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/core/index.ts` is a stand-in barrel until gen writes the entry barrels (STA-339); add every new public file to
  it and to the export list in `src/core/__tests__/index.test.ts`.
- A `@stackra/contracts` type a shape field may name gets its shipped schema here, exported as `<Type>$`
  (`ScopeRef$`), because contracts carries no zod (ADR 0294 decision 26, STA-1284).

## This package

- Runtime dependencies are `@stackra/contracts`, `@stackra/container` and `zod` only. No `@stackra/errors`: a missing
  schema is a `TypeError`.
- Every decorator is made with `createDecorator` and records only (ADR 0294 R6). A field decorator is typed against
  its field (`FieldDecorator<T>`, or `SchemaFieldDecorator<Out>` for `@Field`).
- Field decorators may mark `SHAPE_KINDS`; the class form of `@Renamed` may mark `IDENTITY_KINDS`. A kind package that
  adds a field-carrying kind, or a kind whose identity the manifest locks, adds its code there in the same change.
- `Schema` keeps no state and its `~kind` brand stays protected, so `Fields<X>` and `X$Check` never see it.
- The registry matches a class exactly. Never fall back to a parent's schema: it would strip the subclass's fields.
- A runtime helper's output type must equal the platform type it stands for (`PublicId<P>`, `Date`, `Json`, `Url`),
  or every generated `X$Check` breaks.
- Only add a symbol a consumer imports today (the template, a generated sample, a package, or the registry row).
- Configuration, not code: an identifier, phone, postal-code or address format is market-pack data passed in as an
  `IdentifierFormat` or `AddressFormat`. Add an algorithm (`IdentifierCheck`), never a country's pattern.
- One-time codes store a peppered HMAC only; never log or return a code after issue, never compare with `===`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Imports leaving a folder use the `#core/*` alias.
- No `enum`, no `#private` fields, no parameter properties, no `*.stories.*`.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`pnpm turbo run <task> --filter=@stackra/validation` — `build`, `typecheck`, `lint`, `test`, `test:coverage`,
`format`, `format:check`, `clean`.

## PII

| Data          | Where              | Handling                                                                                          |
| ------------- | ------------------ | ------------------------------------------------------------------------------------------------- |
| None          | —                  | Shapes only; `@Classified` records a field's class of personal data but this package stores none. |
| One-time code | `issueOneTimeCode` | Returned once to the caller for delivery; the record holds an HMAC digest only.                   |
