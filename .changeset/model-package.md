---
"@stackra/model": minor
---

Add `@stackra/model`: the `Model` kind base with `Model.with(...traits)` and `record(event)`, the traits
`HasPublicId(prefix)` (UUIDv7 public ids), `BelongsToTenant`, `Timestamps`, `UserStamps`, `Versioned`, `SoftDeletes`,
`AppendOnly` and `Translatable(fields)`, with `createTrait` and `traitsOf` for traits other packages own. Relations
are `@ManyToOne`, `@OneToMany` and `@ManyToMany` over `Ref<T>`, `Collection<T>` and, across modules, `Link<T>` (an
id-only reference loaded through the owning module's read), with `OnDelete`. `@Index` and `@Searchable` declare table
facts. `Translated` holds a per-locale string with a fallback chain, and `Attributes<M>` types factory definitions.
Generated entity metadata imports `LinkType`, `TranslatedType` and `MoneySchema`, whose amount column refuses a value
beyond `Number.MAX_SAFE_INTEGER`. The old `./traits` and `./orm` entries are folded into `.`.
