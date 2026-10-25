# @stackra/content

Stackra content: the built-in content entry types a content service serves, and bounded custom fields that are data
only (ADR 0116, ADR 0154, ADR 0226). A scope adds a field to a model as a stored definition of a registered type; a
record's values live in a side table and are checked against those definitions on every write.

**Tier:** `tier:lib` (`packages/data/content`). Entries `.` and `./node`. Depends on `@stackra/actions` (the call's
scope through `RequestContext`), `@stackra/contracts`, `@stackra/database`, `@stackra/entitlements`, `@stackra/errors`
and `@stackra/model`.

## What is here

| Entry    | Symbol                                                                                   | Use                                                                 |
| -------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `.`      | `ContentEntryType`                                                                       | the built-in content types (`Faq`, `Testimonial`, `Page`, ...)      |
| `.`      | `CustomFieldType`                                                                        | the registered field types, with their bounds and choices case data |
| `.`      | `CustomFieldDefinition`, `CustomFieldChoice`, `CustomFieldValue`                         | the stored definition, a select's choice, a stored value (types)    |
| `.`      | `checkCustomFieldDefinition`, `checkCustomFields`                                        | the two checks: a definition, and a record's values                 |
| `.`      | `CustomFieldDefinitionInvalidError`, `CustomFieldsInvalidError`, `CustomFieldTakenError` | refusals (400, 400, 409)                                            |
| `./node` | `HasCustomFields`                                                                        | the trait of a model whose records carry custom fields              |
| `./node` | `CustomField`, `CustomFieldValueSet`                                                     | the definition table and the side table of values                   |
| `./node` | `CustomFieldService`                                                                     | define, list, write and read                                        |
| `./node` | `CustomFieldLimitEntitlement`                                                            | the plan limit on how many fields a scope defines (declared only)   |
| `./node` | `HasRevisions`, `Revision`                                                               | the trait of a model that keeps numbered revisions, and their table |

`.` is isomorphic: a browser that imports `ContentEntryType` pulls no ORM.

## Entry types

```ts
const faq = await ctx.query(ListEntriesQuery, { siteId, type: ContentEntryType.Faq });
const type = z.enum(Enum.values(ContentEntryType)); // the content client's input
```

The cases are ADR 0116 CT4's built-in types. A type a scope defines at runtime is data (ADR 0226) and never a case.

## Custom fields

```ts
export class Product extends Model.with(HasPublicId("prd"), Timestamps, HasCustomFields) {}

await fields.define(scope, "catalogue.product", {
  key: "shoeSize",
  type: CustomFieldType.Select,
  label: { en: "Shoe size", ar: "مقاس الحذاء" },
  required: false,
  choices: [
    { value: "42", label: { en: "42" } },
    { value: "43", label: { en: "43" } },
  ],
});
await fields.write(scope, "catalogue.product", product.id, { shoeSize: "42" });
await fields.write("catalogue.product", product.id, { shoeSize: "43" }); // inside an action: the call's scope
await fields.read("catalogue.product", product.id); // { shoeSize: "43" }
```

- `define`, `definitionsOf` and `write` take the `ScopeRef` first, or leave it out to act in the running call's scope
  (`ctx.scope`, ADR 0327 decision 6); a call with no scope is a `TypeError`, since a field always belongs to a node.

- A definition is strict data: an unknown key, a label with `{{`, `${` or `<%`, choices on a type that takes none, and
  bounds a type cannot hold are refused with one field error per path (`custom_field_definition_invalid`).
- `min` and `max` bound a text's length, a number's value or a multi-select's picks. Text is at most 255 characters,
  long text 10,000, a URL 2,048 (http or https only) and an email 254.
- Values are checked by `checkCustomFields`: every key defined, every required value present, `null` clears an optional
  field, and a refusal (`custom_fields_invalid`) names each refused key without echoing its value.
- A repeated key for a model in a scope refuses `custom_field_taken`.
- The number of fields a scope may define is `CustomFieldLimitEntitlement` (`content.custom_field_limit`), a limit
  counting `CustomField`; the host's defining action is the gated call.

## Revisions

```ts
export class RuleSet extends Model.with(HasPublicId("rset"), Timestamps, HasRevisions) {}
```

`HasRevisions` adds no column: a record's revisions are rows of `content.revisions`, keyed by the record's model key
and public id, numbered from 1. A revision's `data` is a frozen snapshot written once; a change is a new revision. A
revision without `publishedAt` is a draft; publishing sets it, and publishing an older revision again rolls back to it
(the current revision is the one published last). The owning package writes revisions through
`Repository<Revision>`, as `@stackra/rules` does for its rule sets, or through `RevisionService`: `draft`,
`publish`, `current`, `rollback`, and for `Schedulable` models `schedule(…, at, campaign)`, `unschedule(campaign)` and
`publishDue(now)`, which the tenant schedule of `@stackra/scheduler` calls. A preview is `findOneOrFail` by number.

## Publishing and slugs

```ts
export class Page extends Model.with(HasPublicId("pag"), Publishable, Sluggable) {}

page.slug = Translated.of({ en: slugOf(title.in("en")), ar: slugOf(title.in("ar")) }); // Arabic stays Arabic
isPublished(page, clock.now()); // published, or scheduled for a time that has come
```

`Publishable` adds `publicationStatus` (`draft`, `scheduled`, `published`), `publishAt` and `publishedAt`;
`Sluggable` adds `slug`, one per locale, unique by the model's own index.

## Tables

`content.custom_fields` holds `id` (`cfd_…`), the scope (`scope_id`, `scope_path`), `model`, `key`, `type`, `label`
(jsonb per locale), `required` and `rules` (choices and bounds, jsonb), unique on scope, model and key.
`content.custom_field_value_sets` holds `id` (`cfv_…`), the scope, `model`, `record_id` and `values` (jsonb by field
key), unique on model and record id. `content.revisions` holds `id` (`rev_…`), the scope, `model`, `record_id`,
`number`, `data` (jsonb), `published_at`, `scheduled_at` and `campaign` (nullable), unique on model, record id and number. All three force
row-level security matching `scope_path` at or below the session's `app.scope_paths` (`Database.withScope`); no
application code adds an isolation filter.

## Not here

- The built-in content type models, tenant-defined content types at runtime and headless delivery: later, each with its model design.
- Removing a definition: `CrudService` has no delete; its policy is a data-wave decision.
- The collaborative-editing `SnapshotStore` driver: the content service owns it (ADR 0270).
