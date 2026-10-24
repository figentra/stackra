---
"@stackra/validation": minor
---

Add `@stackra/validation`, the shapes and field rules of the programming model v3.1, absorbing the retired
`@stackra/schema` and folding the old `./runtime` entry into `.`: the `Schema` kind base with a typed `X.create`;
`CursorInput`, `TableInput` and `Page.of`; `PickType`, `OmitType` and `PartialType`; the field decorators `@Str`,
`@Int`, `@Num`, `@List` (with `each` for lists and maps), `@Trim`, the `@Field(zod)` escape hatch, `@Classified` and
`@Renamed` (class or field), each made with `createDecorator`, record-only and typed against its field; `validate`,
`schemaOf` and `registerSchemas`, the registry generated schemas fill (gap G1), which fails clearly for a class with no
schema; the runtime helpers generated code imports, `publicId`, `isoDateTime`, `json`, `url`, `duration` and
`tableInput`; and the `Assert`, `Fields` and `Same` types of each generated `X$Check`. `Enum` stays in
`@stackra/contracts` and the money codecs in `@stackra/money`.
