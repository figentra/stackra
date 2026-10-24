# @stackra/validation

Shapes and field rules for Stackra. A shape is a class: its field types are its rules, its initializers its defaults,
and a few typed field decorators refine it. `stackra gen` compiles each shape to one zod schema (`X$`) and registers it
here, so `validate(X, raw)` and `X.create(...)` find it. Authors write no zod except through `@Field(zod)`.

**Tier:** `tier:lib` (`packages/foundation/validation`). Entry `.` only (the old `./runtime` entry is folded in).
Depends on `@stackra/contracts`, `@stackra/container` and `zod`. It absorbs the retired `@stackra/schema`.

## What is here

| Symbol                                                             | Use                                                                     |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `Schema`                                                           | `class OrderView extends Schema { ... }`; `OrderView.create({ ... })`   |
| `CursorInput`, `TableInput`, `Page.of(X)`                          | list inputs and the cursor page output                                  |
| `PickType`, `OmitType`, `PartialType`                              | derive a shape from a shape                                             |
| `Str`, `Int`, `Num`, `List`, `Trim`, `Field`                       | field rules, each typed against its field                               |
| `Renamed`, `Classified`                                            | rename marker (class or field) and the privacy class of a field         |
| `validate`, `schemaOf`, `registerSchemas`                          | check input; read a class's schema; the registry generated schemas fill |
| `publicId`, `isoDateTime`, `json`, `url`, `duration`, `tableInput` | the runtime helpers generated schemas and clients import                |
| `Assert`, `Fields`, `Same`                                         | the types of each generated `X$Check`                                   |
| `FieldDecorator`, `ShapeClass`                                     | the types behind a field decorator and a derived shape class            |

`Enum` is `@stackra/contracts`'; `money()` and `currencyCode()` are `@stackra/money`'s.

## Shapes

```ts
import { CursorInput, Int, List, PickType, Schema, Str, validate } from "@stackra/validation";

export class CreateOrderInput extends Schema {
  @List({ min: 1, max: 100 })
  lines!: RequestedLine[];

  extensions: Record<string, Json> = {};
}

export class QuickOrderForm extends PickType(CreateOrderInput, ["lines"]) {
  @Int({ min: 0 })
  redeemPoints = 0;
}

const form = validate(QuickOrderForm, await ctx.formData());
if (!form.success) return ctx.fieldErrors(form.error);
```

A `number` carries `@Int` or `@Num`; `?:` is optional (absent, never `undefined`); `| null` is nullable. tsc refuses
`@Int` on a string, `@List` on a field that is not an array, and a `@Field(zod)` whose output the field cannot hold.
Decorators record only: gen reads them from source, and they never install an accessor.

## The registry

Each generated schemas file calls `registerSchemas([[Class, Class$], ...])`, and every generated entry loads those
files. The registry matches a class exactly: a subclass needs its own schema, so it never validates against its
parent's fields. A class with no schema throws a `TypeError` naming the fix. In a unit test, register a schema the same
way, or load the member's generated schemas through the generated vitest setup.

## Decisions

ADR 0294 (decisions 4, 6, 16, 25 and 26; amendment items 3 and 13), ADR 0095 as amended, ADR 0307 (resource tables),
the 2026-10-24 note on ADR 0127 (`Enum` in contracts, `./runtime` folded, money codecs in `@stackra/money`).
