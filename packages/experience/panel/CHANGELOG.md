# @stackra/panel

## 0.2.0

### Minor Changes

- 6f3536e: A record or bulk action whose input needs more than the record id now opens a modal form generated from its input
  schema (ADR 0307 rule 3): the record id pre-filled, the declared confirm copy shown, one run per selected record, and
  the server's field errors kept on the form with only the refused records left to retry.
- 9558710: Resource tables and View pages show an enum code by its localised label (`<module>::enums.<model>_<field>.<code>`,
  then `<module>::enums.<field>.<code>`, or the keys a column or entry names with the new `.labels(...)`), and a flag
  as a localised yes or no instead of a bare tick or cross.
- eb69aa6: A View page's list entry formats its cells like any value: a `…Minor` cell is money in the item's own `currency`, else
  in the record's currency named by the new `e.list(key, columns, { currency })` option, instead of raw minor units.
- eb37de7: The generic Create and Edit pages each keep only the recorded form fields their own action's input takes, so one
  declared form serves both modes when the create and update inputs differ (an `active` switch only Edit takes).

### Patch Changes

- Updated dependencies [f7ae148]
- Updated dependencies [2d5a888]
- Updated dependencies [cfdcdf8]
- Updated dependencies [2d5a888]
- Updated dependencies [1a9259b]
- Updated dependencies [5fa1a15]
- Updated dependencies [9085c41]
- Updated dependencies [c4f295e]
  - @stackra/access-log@0.2.0
  - @stackra/actions@0.2.0
  - @stackra/database@0.2.0
  - @stackra/errors@0.2.0
  - @stackra/iam@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/ui@0.2.0
  - @stackra/clients@0.2.0
  - @stackra/documents@0.2.0
  - @stackra/entitlements@0.2.0
  - @stackra/tenancy@0.2.0
  - @stackra/query@0.2.0
  - @stackra/data-transfer@0.2.0
  - @stackra/filesystem@0.2.0
  - @stackra/experience@0.2.0
  - @stackra/navigation@0.2.0
  - @stackra/money@0.2.0
  - @stackra/pricing@0.2.0
  - @stackra/model@0.2.0
  - @stackra/icons@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/i18n@0.2.0
  - @stackra/support@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 3da2dcc: Unique form names (STA-1383). The two form models are different things (a tenant-built form a respondent fills, and
  an admin resource form), so they keep separate shapes with separate names. Breaking renames:
  
  - `@stackra/builder`: the form document types `FormField` and `FormStep` are `FormDocumentField` and
    `FormDocumentStep` (its `visibleFields`, the respondent's conditional fields, keeps its name).
  - `@stackra/panel`: `visibleFields(fields, mode)` is `fieldsForMode(fields, mode)` (`FormField` and `FormStep`, the
    resource form builders, keep their names).
- 9310c51: One document-kind vocabulary and a unique block-node name (STA-1383).
  
  - `@stackra/experience/contracts`: `ExperienceKind` gains `Dashboard` (`dashboard`), after `ThemeSection`.
  - Breaking, `@stackra/panel`: `DocumentKind` is removed; `Document({ kind })` takes `ExperienceKind.Page` or
    `ExperienceKind.Dashboard` from `@stackra/experience/contracts` (same codes).
  - Breaking, `@stackra/panel`: the `BlockNode` type (a panel document's table, widget or custom block) is
    `PanelBlockNode`, so `BlockNode` is only experience's renderer component.
- a7961d4: Add the generic resource pages to `@stackra/panel/react` (stackra-220): `ResourceListPage` (the recorded columns, sort,
  filters and search through `@stackra/ui`'s `FilterBar`, cursor pagination, row actions and the bulk bar fanned out per
  record), `ResourceViewPage` (the infolist's entries and sections, the header actions run through the action runner,
  and the relation managers), `ResourceFormPage` (Create and Edit from the recorded form fields or the action input's
  own keys, validated by the input schema, with the server's field errors on their fields) and `RelationManager`.
  `registerPanelPages()` now also registers them as navigation's `resource` page, so every `toResource` route has a page
  with no extra code. `registerResources(trees)` (in `.`) hands the generated resource trees to the pages; a resource
  with no registered tree shows the row's, record's and input's own keys. New `panel::resources.*` texts in all seven
  locales.
- 2787c1e: Add `@stackra/panel`: the `Resource`, `Widget`, `Document` and `Panel` kinds with pure builders gen records, the metric
  shapes and time range input with their schemas, typed slots and placement layers, the data constructors of the
  generated resources, panels and slots, and the web dashboard, shell, action runner and native widget slot. The shell
  holds navigation's breadcrumb trail (`useBreadcrumbs` is re-exported), and `registerPanelPages` gives navigation the
  page its panel routes render.
- aaab926: The plan-catalogue admin console (`PlanCatalogueAdmin`, `CatalogueVersions`, `CatalogueRowsEditor`,
  `CatalogueProposalForm`; STA-799) with dated versions, renewal timing and the second approver for discounts, and the
  `OnboardingChecklist` component (STA-776), with their words in seven languages.
- 9ab18b4: Queued resource export (STA-1490, reporting gap 11, ADR 0307 rule 10). `@stackra/panel/node` adds `ExportRunner`: it
  pages a resource's list query as the reader (per-row permissions), drops `@Classified` columns unless opted in under an
  L2 permission, streams at most `maxRows` rows into CSV, XLSX, JSON Lines or PDF on the host disk, and returns a 24-hour
  signed link whose issue is access-logged. Adds `ExportInput`, `ExportOutput`, `ExportSource`, `ExportConfig`
  (`ExportOptions`, `ExportConfig$`), and `ExportFormat.JsonLines` and `ExportFormat.Pdf`. `@stackra/documents` adds
  `PdfTableWriter`, data-transfer's `TabularWriter` for PDF, built per export. New dependencies: panel on
  `@stackra/access-log`, `@stackra/config`, `@stackra/data-transfer`, `@stackra/documents`, `@stackra/filesystem`;
  documents on `@stackra/data-transfer`.
- bf83013: Saved view shapes (STA-1489). `SavedView.sort`, `group` and `totals` (and `StoredView`'s) are now the shape classes
  `SavedViewSort`, `SavedViewGroup` and `SavedViewTotal`, exported with their shipped schemas `SavedViewSort$`,
  `SavedViewGroup$` and `SavedViewTotal$`, so gen compiles them as shapes instead of zod hatches. `SavedView.filter` is
  typed `Record<string, Json>`. The wire format is unchanged: `SavedView$` composes the three schemas.
- c758552: Saved views, finished (STA-1489, reporting gap 7). `ViewStore` is now a port, and a new `./node` entry ships its
  `database` driver `DatabaseViewStoreDriver` over `panel.stored_views` (tenant policy, `version` column, migration 0001),
  with `StoredView`, `StoredViewService` and `ViewPermissions.share` (`panel.view.share`). `SavedView` gains `layout`
  (`ViewLayout`: table, board, gallery, calendar, chart) with `layoutBy`, `version`, and role copies
  (`ViewSharing.Role` with `role`). The server validator `unknownViewKeys` refuses undeclared keys with
  `ViewKeyUnknownError` (`view_key_unknown`). `ResourceListPage` takes a `views` store and draws saved views as tabs; the
  native entry adds `SavedViewTabs`. New dependencies: `@stackra/database`, `@stackra/model`, `@stackra/tenancy`.
- 0ad504e: Add saved views with grouping, sub-grouping, totals and sharing (`SavedView`, `SavedView$`, the `ViewStore` port,
  `groupRows`, `Aggregate`, `ViewSharing`); normal and developer visibility of form fields (`essential` on `FormField`
  and `.essential()` in a form, `visibleFields`); and edition slots of ADR 0350: `Place.LineEntry` with `lineEditorOf`,
  and `activeContributions` for contributions to enhanced modules.
- 2e21e6a: Add the French, German, Spanish, Italian and Dutch `panel` catalogues (STA-788, ADR 0403).
- d7c5bf2: Add shell slot contracts (ADR 0438): `defineSlot<Props>({ key, surface, cardinality })` declares a typed slot in a
  shell package and `fillSlot(slot, component, { surface })` fills it from a product's UI package, with the `Slot`,
  `SlotFill`, `SlotOptions`, `SlotCardinality` and `SlotComponent` types.
- ae9621e: Reports return server subtotals per leading dimension (`subtotals: true`) and a pivot matrix with row and column
  totals (`pivot: { rows, columns }`), all from one grouping-sets statement. The panel's `Aggregate` is now
  `@stackra/database`'s (`average` becomes `avg`, `distinct` is added); `groupRows` is for fully loaded tables only.
- 37e1aa8: Round C. gen: lazy catalogue loaders and `loadMessages(locale)` in the generated I18n (only runtime dependencies bring
  lang); event wire names stay `<module>.<name>.v<n>` and a prefixed name is refused (`event_name_prefixed`); a service
  subscribes its own topics into its inbox for local listeners; the coverage-audit refusals (`checkConventions` and
  friends). i18n: `loadMessages` with the ar-SA, ar, en fallback chain. Packages that ship `assets/lang` export
  `./assets/*`. tenancy: `belongsToTenant({ nullable: true })` compiles through `equalsOrUnset`. workflow: `ServiceAcked`
  carries `KeptRecords` (migration 0008). identity: app-approval sign-in and step-up with number matching and QR.
  filesystem: `readStream` on every disk. content: custom fields per runtime subtype (migration 0004); `ContentModule`
  exports `RevisionService`. actions: `RateLimitBudget` port sizes the area bucket. licensing: `LicenceIssuer` port with
  Keygen and memory drivers, install key signer and signed usage reports.
- 9811f8d: Add the search API and the Cmd+K palette (ADR 0221 d4 and d6, STA-1459): `SearchQuery(Model)` in
  `@stackra/search/node` is the base of the `<model>.search` query gen writes per `@Searchable` model, answering a phrase
  with hits of key, title and snippet under the caller's visibility (`SearchQueryInput`, `SearchQueryOutput`,
  `SearchQueryHit`); a public search is the same query with anonymous actors in the public area. `SearchPalette` in
  `@stackra/panel/react` searches those queries as the reader types and hands the picked hit to the app.
- 3e2fc84: `CrudService.table(input, { count })` adds the matching rows' count to the page (`page.count`, a `TableCount`).
  `Count.Estimated` counts exactly up to 10,000 rows (`BULK_LIMITS.countCap`) and past it reports the cap with the
  planner's estimate; `Count.Exact` counts every row (ADR 0307 rule 12, reporting gap 6). `Count` now lives in
  `@stackra/database`; `@stackra/panel` re-exports it, and the resource list shows the count beside the filter bar,
  capped as "10,000+" (new `panel::resources.count` and `count_capped` texts in all seven locales).
- 5e8114b: Resource tables get the full filter and sort vocabulary (reporting gap 5, ADR 0307 rule 2). `@stackra/database`:
  `CrudService.table` reads each filter value as a `TableFilter` (a value, a list, or `{ op }` for `range`,
  `dateRange` with bounds or a named relative range resolved by the new `TableOptions.period`, `gt`/`gte`/`lt`/`lte`/`ne`,
  `contains` and `isNull`) and a multi-key sort (`TableSort[]`, three keys at most, the primary key last). Any other
  object filter value, which used to reach MikroORM as is, is now refused with `table_filter_invalid`
  (`TableFilterInvalidError`). `@stackra/panel`: `Filter.range`, `Filter.dateRange`, `Filter.compare` with the new
  `FilterComparison` enum, `Filter.contains`, `Filter.isNull` (and the same on the table builder's filter factory),
  `.thenSort(key, direction)` tiebreak keys on the default sort, and `tableInput` sends each drawn value in its wire form;
  the web list draws range, date-range and is-null filters with `@stackra/ui`'s number, date-range and boolean editors.
  `@stackra/gen`: the full pass refuses a recorded resource table that sorts or filters on a path no index leads with
  (`sort_not_indexed`, `filter_not_indexed`).

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- 187afe3: `CatalogueRow` has one home, `@stackra/contracts` (STA-1383). Breaking: `@stackra/pricing` and `@stackra/entitlements`
  no longer export their identical copies; import `CatalogueRow` from `@stackra/contracts`.
- 4c5af60: The panel catalogues ship the derived labels of every enum case in all seven locales: `ExportFormat` `jsonl` and `pdf`,
  `FilterComparison` (`gt`, `gte`, `lt`, `lte`, `ne`), `ViewLayout` and `ViewSharing` `role`, so gen no longer refuses
  them as `i18n_key_missing`.
- fd13f0e: Import the shared helpers from `@stackra/support` and delete the local copies (stackra-224): notifications
  (`base64url`, `htmlToText`), webhooks and licensing (`decodeBase64`; licensing also `isRecord`), rules (`isRecord`),
  data-transfer and identity (`crc32`), documents and experience (`escapeHtml`; experience's `./edge` and `./server`
  re-export support's), experience (`htmlToText`: the text part now has a blank line after each block, as notifications'
  did), seo and brand-kit (`escapeXml`; brand-kit now refuses a control character), market-packs (`canonicalJson`: the
  one canonical form, so integer-like keys sort as text), gen (`snakeCase`, `kebabCase`, `camelCase`, `pascalCase`),
  panel (`snakeCase`), calendar (`ageOn`, re-exported beside `LeapBirthday`) and identity (`ageOn`). Identity's
  `ActForOptions` gains `leapBirthday` (the market pack's 29 February rule; `march_1` when absent, the earlier
  behaviour). New dependency for each except licensing: `@stackra/support`.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [e01195a]
- Updated dependencies [7149b08]
- Updated dependencies [2787c1e]
- Updated dependencies [f96db97]
- Updated dependencies [f81699d]
- Updated dependencies [f7fb4ad]
- Updated dependencies [e7a388a]
- Updated dependencies [68dd2a5]
- Updated dependencies [e0f2fc8]
- Updated dependencies [2787c1e]
- Updated dependencies [df3f38b]
- Updated dependencies [4413118]
- Updated dependencies [a6ec591]
- Updated dependencies [38fb3e2]
- Updated dependencies [5ae13cb]
- Updated dependencies [bc4acfc]
- Updated dependencies [0202770]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [99665bb]
- Updated dependencies [8ead1a8]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [dddbbcd]
- Updated dependencies [e2a4b0d]
- Updated dependencies [b3c4658]
- Updated dependencies [975b28c]
- Updated dependencies [94ae85f]
- Updated dependencies [dddbbcd]
- Updated dependencies [856995c]
- Updated dependencies [e7ee0a4]
- Updated dependencies [ca85d59]
- Updated dependencies [d72a734]
- Updated dependencies [9841d79]
- Updated dependencies [f6d1a76]
- Updated dependencies [c196bc6]
- Updated dependencies [49ab0e6]
- Updated dependencies [d156aa8]
- Updated dependencies [6d46e5e]
- Updated dependencies [2787c1e]
- Updated dependencies [38a5501]
- Updated dependencies [e0f2fc8]
- Updated dependencies [62c7ae1]
- Updated dependencies [c868bad]
- Updated dependencies [0d36f0d]
- Updated dependencies [a701ccb]
- Updated dependencies [a526605]
- Updated dependencies [da8bdbd]
- Updated dependencies [763e901]
- Updated dependencies [936fcb1]
- Updated dependencies [f11cbe8]
- Updated dependencies [f7a2d36]
- Updated dependencies [dfa0c6a]
- Updated dependencies [6da76a2]
- Updated dependencies [a45aec8]
- Updated dependencies [281ec71]
- Updated dependencies [830898b]
- Updated dependencies [6bb8ea8]
- Updated dependencies [e45cd73]
- Updated dependencies [6006b78]
- Updated dependencies [fd3427e]
- Updated dependencies [e01195a]
- Updated dependencies [783fb5b]
- Updated dependencies [c994359]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [5a25b49]
- Updated dependencies [d58a505]
- Updated dependencies [f65a9e9]
- Updated dependencies [483eb44]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [e8ab3ca]
- Updated dependencies [2787c1e]
- Updated dependencies [903c2a5]
- Updated dependencies [a57a0df]
- Updated dependencies [d156aa8]
- Updated dependencies [6dd5245]
- Updated dependencies [a289662]
- Updated dependencies [d72a734]
- Updated dependencies [2787c1e]
- Updated dependencies [20f3fe9]
- Updated dependencies [6919ebd]
- Updated dependencies [27efea7]
- Updated dependencies [0a38324]
- Updated dependencies [6f2c1f7]
- Updated dependencies [3d080e7]
- Updated dependencies [e1dde33]
- Updated dependencies [6d04650]
- Updated dependencies [2787c1e]
- Updated dependencies [d9d5187]
- Updated dependencies [fd1a986]
- Updated dependencies [67aa168]
- Updated dependencies [82a533d]
- Updated dependencies [2787c1e]
- Updated dependencies [3312ef3]
- Updated dependencies [f0c9f64]
- Updated dependencies [9fa447e]
- Updated dependencies [9277eeb]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [d8ea8c2]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [d5e5ff8]
- Updated dependencies [9841d79]
- Updated dependencies [d156aa8]
- Updated dependencies [2787c1e]
- Updated dependencies [c580aa4]
- Updated dependencies [7e60fa9]
- Updated dependencies [b62c042]
- Updated dependencies [e52a367]
- Updated dependencies [c56d7fe]
- Updated dependencies [2787c1e]
- Updated dependencies [5fe0327]
- Updated dependencies [2787c1e]
- Updated dependencies [914465a]
- Updated dependencies [9310c51]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [9fc14fd]
- Updated dependencies [0a20a9f]
- Updated dependencies [9ab18b4]
- Updated dependencies [90957bd]
- Updated dependencies [f833d94]
- Updated dependencies [85b7b49]
- Updated dependencies [2787c1e]
- Updated dependencies [c63175b]
- Updated dependencies [d5f5acf]
- Updated dependencies [0e7eb1f]
- Updated dependencies [e7a388a]
- Updated dependencies [2d7233c]
- Updated dependencies [2787c1e]
- Updated dependencies [6912039]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [074d3e8]
- Updated dependencies [ae9621e]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [ca44233]
- Updated dependencies [a31d463]
- Updated dependencies [158f6cf]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [fd13f0e]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [c3ff8a7]
- Updated dependencies [a55aa40]
- Updated dependencies [cbc545c]
- Updated dependencies [2787c1e]
- Updated dependencies [dacb5c2]
- Updated dependencies [fd13f0e]
- Updated dependencies [349db18]
- Updated dependencies [3e2fc84]
- Updated dependencies [5e8114b]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [a45c902]
- Updated dependencies [2c0ea71]
- Updated dependencies [1271b88]
- Updated dependencies [ab9cc36]
- Updated dependencies [f04fec9]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [897ef24]
- Updated dependencies [9fa447e]
- Updated dependencies [5ae6115]
- Updated dependencies [d41fc93]
- Updated dependencies [9fa447e]
- Updated dependencies [d44e69c]
- Updated dependencies [9fa447e]
- Updated dependencies [b58ebce]
- Updated dependencies [3f2898c]
- Updated dependencies [9fa447e]
- Updated dependencies [69e90f1]
- Updated dependencies [9fa447e]
- Updated dependencies [1c29328]
- Updated dependencies [57f55b7]
- Updated dependencies [2e21e6a]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [e193feb]
- Updated dependencies [65da65c]
- Updated dependencies [65da65c]
- Updated dependencies [69e90f1]
- Updated dependencies [3f2898c]
- Updated dependencies [69e90f1]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/access-log@0.1.0
  - @stackra/actions@0.1.0
  - @stackra/clients@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/data-transfer@0.1.0
  - @stackra/database@0.1.0
  - @stackra/model@0.1.0
  - @stackra/ui@0.1.0
  - @stackra/documents@0.1.0
  - @stackra/entitlements@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/experience@0.1.0
  - @stackra/filesystem@0.1.0
  - @stackra/iam@0.1.0
  - @stackra/i18n@0.1.0
  - @stackra/icons@0.1.0
  - @stackra/money@0.1.0
  - @stackra/navigation@0.1.0
  - @stackra/pricing@0.1.0
  - @stackra/query@0.1.0
  - @stackra/support@0.1.0
  - @stackra/tenancy@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
