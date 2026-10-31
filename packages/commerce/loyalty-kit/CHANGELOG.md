# @stackra/loyalty-kit

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [cfdcdf8]
- Updated dependencies [2d5a888]
- Updated dependencies [1a9259b]
- Updated dependencies [5fa1a15]
- Updated dependencies [9085c41]
- Updated dependencies [6f3536e]
- Updated dependencies [9558710]
- Updated dependencies [eb69aa6]
- Updated dependencies [eb37de7]
- Updated dependencies [c4f295e]
  - @stackra/actions@0.2.0
  - @stackra/database@0.2.0
  - @stackra/errors@0.2.0
  - @stackra/iam@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/panel@0.2.0
  - @stackra/ui@0.2.0
  - @stackra/integrations@0.2.0
  - @stackra/search@0.2.0
  - @stackra/outbox@0.2.0
  - @stackra/queue@0.2.0
  - @stackra/scheduler@0.2.0
  - @stackra/workflow@0.2.0
  - @stackra/tenancy@0.2.0
  - @stackra/ledger@0.2.0
  - @stackra/settings@0.2.0
  - @stackra/versioning@0.2.0
  - @stackra/experience@0.2.0
  - @stackra/money@0.2.0
  - @stackra/model@0.2.0
  - @stackra/testing@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/events@0.2.0
  - @stackra/i18n@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- fa0ed99: `LoyaltyCardPass` (`Pass({ key: "loyalty_card" })`) and `LoyaltyCardPassSource` in `./node`: the loyalty card wallet
  pass content (programme name, balance, tier, account id as serial and QR code, brand colours and logo), with
  `passes.loyalty_card.*` labels in seven locales (new de, es, fr, it, nl lang files). New dependency:
  `@stackra/integrations`.
- 2787c1e: Add `@stackra/loyalty-kit`, the golden capability kit on `@stackra/ledger`: points accounts, tiers, earning and
  redemption behind the `LoyaltyLedger` and `LoyaltyMembers` ports, memory and Postgres ledgers whose expiry is cut at
  zero, the loyalty account permissions and policy, the module's actions and queries (each naming its permission), the
  undoable redemption workflow with its confirmation signal, versioned events, extension point, settings and migrations,
  the panel resource, overview dashboard and two widgets, web and native renderers, and the members fake, points fixture
  and balance matcher.
- f1b9c64: `PartiesLoyaltyMembersDriver` (STA-804): the `LoyaltyMembers` answer over the OS parties service. An OS host subclasses
  it with its generated `PartiesClient`; a live person (`parties.person.get@1`) is a member, an unknown, merged-away or
  erased one is not, and any other failure throws so a redemption fails closed.
- fadd825: Programme and tier hook (ADR 0454): the `isActive` and `earnPerMinor` settings (a paused programme earns nothing; the
  earn rate is per scope), `LoyaltyService.quoteEarn` takes the scope's rate, the `LoyaltyTierPolicy` port with the
  `threshold` driver behind `RecalculateTierListener` (a host replaces it with `@Replaces`), `PointsRedeemed` is now the
  integration event `loyalty_kit.points.redeemed.v1` with `balanceAfter`, and the new `PointsExpired`
  (`loyalty_kit.points.expired.v1`) is recorded by the expiry job. `AccountService` now takes a `SettingsReader`.
- 48e9fed: The point value and the redemption cap are settings (`loyalty_kit.pointValueMinor`, `loyalty_kit.maxRedeemPercent`,
  approval required), and config `earnPerMinor`, `pointValueMinor` and `maxRedeemPercent` are removed (breaking for a host
  that overrode them in config: set them as settings instead). `LoyaltyService` no longer takes the config:
  `quote(member, requested, totalMinor, rates)`, `quoteEarn(amountMinor, earnPerMinor)` and `pointsFor(amountMinor,
  pointValueMinor)` take the scope's values, and `RedeemPointsWorkflow` reads them from `LoyaltyKitSettings`. New
  `AccountService.takeBack(member, points, reference)` (a covered `adjust` debit cut at the balance, once per reference,
  `loyalty_kit.points.taken_back.v1`) and `AccountService.importBalance(member, { points, reference, tier? })` (an exact
  `earn` entry under `import:`, tier raised only, `loyalty_kit.points.imported.v1`), with the `RedemptionRates` and
  `PointsImport` types and the `TAKE_BACK_REFERENCE_PREFIX` and `IMPORT_REFERENCE_PREFIX` constants (STA-1323).
- 4d4eb5a: Add stamp cards (earning by visit count): `AccountService.earnVisit`, `EarnVisitAction`
  (`loyalty_kit.points.earn_visit@1`) with its input and output, `stampCardProgress`, the `stamp` permission, and the
  `stampsPerVisit` and `stampsPerCard` settings.
- 8249be0: `MoneyAmount` and `CurrencyCode` in place of bare minor-unit pairs (STA-1383). Breaking:
  
  - `@stackra/loyalty-kit/contracts`: `EarnRequest` and `EarnDraft` take `amount: MoneyAmount` instead of `amountMinor`
    and `currency`; `RedemptionQuote` returns `amount: MoneyAmount` instead of `amountMinor`; `LoyaltyService.quote`
    takes `total: MoneyAmount` instead of `totalMinor`. The stored redeem input and output schemas keep `totalMinor` and
    `amountMinor`; the workflow maps at that boundary with the run's currency.
  - `@stackra/registry`: `computePartnerPayout` takes a `MoneyAmount` gross and returns `{ gross, fee, net }` amounts;
    `PerkListingCharge` carries `amount: MoneyAmount` instead of `currency` and `amountMinor`. The stored `PartnerPayout`
    and `FeeSchedule` records keep their columns.
  - `@stackra/ledger`: `JournalEntry.currency` is a `CurrencyCode`; the amount stays a number so points journals work.
  
  loyalty-kit, registry and ledger now depend on `@stackra/money`.

### Patch Changes

- 5ae13cb: Each `AppendOnly` model's table now has a migration that calls `t.appendOnly()` (STA-1413), so `UPDATE` is revoked
  from `public` and the service's role and gen's `append_only_not_revoked` check passes: access-log 0003 (access and
  audit log entries), ai 0003 (`messages`, `steps`, `tool_calls`) and loyalty-kit 0003 (`ledger_entries`, exported as
  `AppendOnlyLedgerEntriesMigration`).
- 165fae0: Register the generated report queries (`#stackra/reports`) and search queries (`#stackra/search`) like authored
  queries: each gets its manifest entry, derived endpoint, MCP tool and wiring binding (`reportQueriesOf`,
  `searchQueriesOf`), with the package input and output schemas under the module's `schemas`. The loyalty-kit manifest
  lists its `loyalty_kit.loyalty_account.search@1` query. The manifest records a query's `reads`, so a service's wiring reaches `ReplicaReads` for a hosted
  package's replica query too.
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
- a3d23d9: Rule-gap B-7 (stackra-234): `typescript/explicit-module-boundary-types` at error for packages; apps, workers, tools,
  build scripts, tests, stories and e2e specs are off.
  
  The other packages: no behaviour change. Exported functions and public class members now spell the return type they
  already had: components return `ReactElement` (or `ReactElement | null`), panel overrides their base's node type,
  Pulumi helpers an object type of their resources, and zod factories their schema type. `tableInput` keeps its inferred
  schema type with a reasoned disable.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- 9310c51: One document-kind vocabulary and a unique block-node name (STA-1383).
  
  - `@stackra/experience/contracts`: `ExperienceKind` gains `Dashboard` (`dashboard`), after `ThemeSection`.
  - Breaking, `@stackra/panel`: `DocumentKind` is removed; `Document({ kind })` takes `ExperienceKind.Page` or
    `ExperienceKind.Dashboard` from `@stackra/experience/contracts` (same codes).
  - Breaking, `@stackra/panel`: the `BlockNode` type (a panel document's table, widget or custom block) is
    `PanelBlockNode`, so `BlockNode` is only experience's renderer component.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- f04fec9: Make every declaration emit self-contained (TS2883, STA-1220): explicit types on `TierMultiplierExtension`'s base,
  `Dropdown`, the observability stack functions, `JOB_TYPES` and `SCHEDULED_JOBS`, and the type `PassBase` exported from
  `@stackra/integrations` so a consumer's `extends Pass({ key })` class can be declared.
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
- Updated dependencies [072a443]
- Updated dependencies [0abe92d]
- Updated dependencies [bc4acfc]
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
- Updated dependencies [fb93026]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [3a9eb7e]
- Updated dependencies [cc8db5e]
- Updated dependencies [e7a388a]
- Updated dependencies [2787c1e]
- Updated dependencies [e8ab3ca]
- Updated dependencies [2787c1e]
- Updated dependencies [903c2a5]
- Updated dependencies [a57a0df]
- Updated dependencies [3da2dcc]
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
- Updated dependencies [2ead19c]
- Updated dependencies [a9d39cf]
- Updated dependencies [ae5f6cd]
- Updated dependencies [24671ba]
- Updated dependencies [975a6c1]
- Updated dependencies [865cf77]
- Updated dependencies [90e65ce]
- Updated dependencies [0046fbd]
- Updated dependencies [834d55b]
- Updated dependencies [c2b8ed4]
- Updated dependencies [2787c1e]
- Updated dependencies [47cc2f6]
- Updated dependencies [2432cca]
- Updated dependencies [ffda24c]
- Updated dependencies [fa0ed99]
- Updated dependencies [09823c1]
- Updated dependencies [9277eeb]
- Updated dependencies [dddbbcd]
- Updated dependencies [975a6c1]
- Updated dependencies [2787c1e]
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
- Updated dependencies [8249be0]
- Updated dependencies [c56d7fe]
- Updated dependencies [2787c1e]
- Updated dependencies [5fe0327]
- Updated dependencies [914465a]
- Updated dependencies [9310c51]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [09080ac]
- Updated dependencies [0a20a9f]
- Updated dependencies [2787c1e]
- Updated dependencies [3d34a5d]
- Updated dependencies [4c5af60]
- Updated dependencies [a7961d4]
- Updated dependencies [2787c1e]
- Updated dependencies [aaab926]
- Updated dependencies [9ab18b4]
- Updated dependencies [bf83013]
- Updated dependencies [c758552]
- Updated dependencies [0ad504e]
- Updated dependencies [2e21e6a]
- Updated dependencies [d7c5bf2]
- Updated dependencies [d5f5acf]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3d0354e]
- Updated dependencies [4ca7b80]
- Updated dependencies [6d0152d]
- Updated dependencies [1e26ab8]
- Updated dependencies [d72a734]
- Updated dependencies [2787c1e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [074d3e8]
- Updated dependencies [ae9621e]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [ca44233]
- Updated dependencies [fbaaba0]
- Updated dependencies [22ffbbf]
- Updated dependencies [2787c1e]
- Updated dependencies [a31d463]
- Updated dependencies [38bebd1]
- Updated dependencies [cf64395]
- Updated dependencies [158f6cf]
- Updated dependencies [1f34fad]
- Updated dependencies [d72a734]
- Updated dependencies [68ae29e]
- Updated dependencies [20f3fe9]
- Updated dependencies [2787c1e]
- Updated dependencies [3649655]
- Updated dependencies [9811f8d]
- Updated dependencies [be97996]
- Updated dependencies [41035cc]
- Updated dependencies [7055e31]
- Updated dependencies [1e3e28d]
- Updated dependencies [7e60fa9]
- Updated dependencies [d156aa8]
- Updated dependencies [02a7917]
- Updated dependencies [fdf4b94]
- Updated dependencies [3671963]
- Updated dependencies [640ae17]
- Updated dependencies [62a97c0]
- Updated dependencies [56dde43]
- Updated dependencies [786f390]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [69363bf]
- Updated dependencies [9759078]
- Updated dependencies [47554e7]
- Updated dependencies [fd13f0e]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [c3ff8a7]
- Updated dependencies [3e2fc84]
- Updated dependencies [5e8114b]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [a45c902]
- Updated dependencies [2c0ea71]
- Updated dependencies [e344058]
- Updated dependencies [2787c1e]
- Updated dependencies [a65c6bc]
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
- Updated dependencies [fc51f13]
- Updated dependencies [c7e6988]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
- Updated dependencies [ad2a950]
- Updated dependencies [fc44266]
- Updated dependencies [2787c1e]
- Updated dependencies [7441e28]
- Updated dependencies [eb2572b]
  - @stackra/actions@0.1.0
  - @stackra/integrations@0.1.0
  - @stackra/events@0.1.0
  - @stackra/outbox@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/database@0.1.0
  - @stackra/model@0.1.0
  - @stackra/ui@0.1.0
  - @stackra/search@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/versioning@0.1.0
  - @stackra/experience@0.1.0
  - @stackra/panel@0.1.0
  - @stackra/iam@0.1.0
  - @stackra/i18n@0.1.0
  - @stackra/ledger@0.1.0
  - @stackra/money@0.1.0
  - @stackra/queue@0.1.0
  - @stackra/scheduler@0.1.0
  - @stackra/settings@0.1.0
  - @stackra/tenancy@0.1.0
  - @stackra/testing@0.1.0
  - @stackra/validation@0.1.0
  - @stackra/workflow@0.1.0

Written by Changesets on release; never edited by hand.
