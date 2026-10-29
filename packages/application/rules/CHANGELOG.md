# @stackra/rules

## 0.1.0

### Minor Changes

- c34bf79: `GeoPoint` has one home, `@stackra/contracts`. Breaking: `@stackra/rules/contracts`, `@stackra/shipping/contracts` and
  `@stackra/i18n/contracts` no longer export their identical copies; import `GeoPoint` from `@stackra/contracts` (STA-1383).
- 9fc14fd: Put `@stackra/rules`, `@stackra/access-log`, `@stackra/scope`, `@stackra/market-packs`, `@stackra/devices`,
  `@stackra/collaboration` and `@stackra/payments` on the framework version line beside the packages the OS catalog
  already lists, with `@stackra/segments`, which `@stackra/iam` depends on and the catalog also lacks (STA-819).
- 37e1aa8: Round C. gen: lazy catalogue loaders and `loadMessages(locale)` in the generated I18n (only runtime dependencies bring
  lang); event wire names stay `<module>.<name>.v<n>` and a prefixed name is refused (`event_name_prefixed`); a service
  subscribes its own topics into its inbox for local listeners; the coverage-audit refusals (`checkConventions` and
  friends). i18n: `loadMessages` with the ar-SA, ar, en fallback chain. Packages that ship `assets/lang` export
  `./assets/*`. tenancy: `belongsToTenant({ nullable: true })` compiles through `equalsOrUnset`. workflow: `ServiceAcked`
  carries `KeptRecords` (migration 0008). identity: app-approval sign-in and step-up with number matching and QR.
  filesystem: `readStream` on every disk. content: custom fields per runtime subtype (migration 0004); `ContentModule`
  exports `RevisionService`. actions: `RateLimitBudget` port sizes the area bucket. licensing: `LicenceIssuer` port with
  Keygen and memory drivers, install key signer and signed usage reports.
- f7a2d36: Add `FIELD_KEY` in `./contracts`, the one camelCase key casing `Rules.create` and `FactSource$` use. `./node` gains the
  `ConditionField` model (`rules.condition_fields`, migration 0003) and `ConditionFieldService` (sync from `FactSource$`
  documents, `rulesOf`, `check`). `ACTION_PERMISSION_RULES`, `actionPermissionRowsOf` and `RuleSetService.approvalMatrix`
  read the `ai.action_permissions` rule set into `ActionPermissionRow[]`; `packApprovalFloorOf` reads the
  `ai.approval_floor` pack value. `OutcomeParam.optional` and `RulesOptions.maxOutcomes` (1 to 500) for matrix rows, with
  lang keys in seven locales.
- 67aa168: Add the `FactProvider` port, `factsFrom(providers, subject)` and the `FactSubject` type: an add-on supplies a fact
  source's facts for a subject (segment membership), so a business rule can target a segment without the engine or IAM
  depending on the add-on (ADR 0462 decision 1).
- 0a96532: Declare outcome kinds as classes (`RuleOutcome({ key, label, params })`) that `Rules.create` takes beside the data form
  and gen lists in the manifest. Floors guard money parameters too: a money floor's pack value is `{ minor, currency }`,
  and an amount in another currency is moved to the floor. `floorProblems` and `checkOutcomes(input, floors)` refuse an
  outcome past a floor at save time (`past_floor`, `currency_mismatch`), `RuleSetService.draft` takes the market's
  floors, and `RuleBuilder` edits outcomes and marks floors before the save. Ship `Condition$` and `FactSource$` and add
  `rules.conditionSchema()` for untrusted condition trees checked against a field registry (STA-773, STA-817, ADR 0425).
- 49c3553: Add outcome kinds to `@stackra/rules`: consumers register `OutcomeKind`s beside their fact sources, `Rules.checkOutcomes`
  checks stored outcomes, `decide` evaluates a rule and guards every outcome against the market-pack floors
  (`guardFloors`, `Decision.floored`), and `OutcomeDispatcher` routes outcomes to the consumer's handlers. Rule sets now
  store outcomes with their condition (`RuleSetService.draft`, `decide`), and default rule sets ship as versioned
  `RuleSetPack$` documents seeded with `RuleSetService.seed` and `seedPack` (migration `rules.0002`), never overwriting a
  tenant's edit.
- c21a223: A pack's default rule set opens with no `ScopeRef`: `packRuleSetOf(pack, key, rules)` (isomorphic) and
  `RuleSetService.openDefault(pack, key, rules)` return it checked against the consumer's `Rules`, ready for `decide`.
  `Rules.register(...sources)` adds an edition's fact sources after `Rules.create`; a condition naming an unregistered
  source is still refused at save time. A `list` outcome parameter may name a `list` floor: `crossedFloor` and
  `guardFloors` move a list missing floor items to the list plus those items. `Rules.sources` is now a getter (ADR 0455,
  STA-917).
- 2787c1e: Add `@stackra/rules`, one condition engine for every rule consumer: fixed operator sets per field type, fact sources a
  consumer registers, a checked condition tree, deterministic evaluation explained by tree path, versioned rule sets and
  the rule builder; `@stackra/content` gains the `HasRevisions` trait with its `Revision` model and migration.
- ca44233: Breaking renames for unique public names (STA-1383): `@stackra/rules` `Decision` is `RuleDecision` (iam's `Decision`
  is the allow or deny enum) and `Facts` is `RuleFacts` (ai's `Facts` is the facts kind base). Importers are updated.

### Patch Changes

- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
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
- Updated dependencies [534d7c8]
- Updated dependencies [d1b23c1]
- Updated dependencies [13ad6ab]
- Updated dependencies [b8fc2ac]
- Updated dependencies [20f3fe9]
- Updated dependencies [2787c1e]
- Updated dependencies [0e90fc3]
- Updated dependencies [b966fad]
- Updated dependencies [975a6c1]
- Updated dependencies [900e79d]
- Updated dependencies [5ae13cb]
- Updated dependencies [0abe92d]
- Updated dependencies [bc4acfc]
- Updated dependencies [99665bb]
- Updated dependencies [8ead1a8]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [2787c1e]
- Updated dependencies [dd341a0]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
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
- Updated dependencies [6bb8ea8]
- Updated dependencies [e45cd73]
- Updated dependencies [6006b78]
- Updated dependencies [483eb44]
- Updated dependencies [acff14a]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [cc8db5e]
- Updated dependencies [e7a388a]
- Updated dependencies [2787c1e]
- Updated dependencies [6f2c1f7]
- Updated dependencies [3d080e7]
- Updated dependencies [e1dde33]
- Updated dependencies [6d04650]
- Updated dependencies [2787c1e]
- Updated dependencies [d9d5187]
- Updated dependencies [fd1a986]
- Updated dependencies [9277eeb]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [d8ea8c2]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [c21a223]
- Updated dependencies [c1818fd]
- Updated dependencies [b88a78d]
- Updated dependencies [38ef655]
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
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [9fc14fd]
- Updated dependencies [0a20a9f]
- Updated dependencies [d5f5acf]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [ae9621e]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [2787c1e]
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
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/ai@0.1.0
  - @stackra/events@0.1.0
  - @stackra/container@0.1.0
  - @stackra/content@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/database@0.1.0
  - @stackra/model@0.1.0
  - @stackra/ui@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/i18n@0.1.0
  - @stackra/market-packs@0.1.0
  - @stackra/money@0.1.0
  - @stackra/support@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
