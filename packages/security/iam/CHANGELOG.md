# @stackra/iam

## 0.1.0

### Minor Changes

- 6f2c1f7: Add the `HasMetadata` and `HasOwner` traits (ADR 0321 d4, data-layer gap mo18). `@stackra/database` exports
  `HasMetadata` (a `metadata` bag of string keys to string values, at most 16 KB), the blueprint's `t.metadata()` (with an
  optional GIN index), `MetadataSubscriber` and `MetadataInvalidError`; `CrudService` checks metadata on every write.
  `@stackra/iam/node` exports `HasOwner` (`ownerId`, the owner or assignee) and `OwnerMacro` (`t.owner()`).
- 67aa168: IAM is permission-only and knows no segments (ADR 0462 decision 1): `Audience` is `ScopeRef | RoleRef`, `Audience$`
  refuses `{ kind: "segment" }`, `PolicySnapshot` and `MemoryPolicyState` drop `segments` (an older snapshot event's
  `segments` key is ignored), and the decision point and visibility filter no longer match segment audiences. The
  `@stackra/segments` dependency is removed. `Permissions`, `Permission` and `Risk` stay in `@stackra/iam`.
- 82a533d: Add the existence-only query: `ExistenceQueryService.matching(model, where, { limit })` (`./node`) answers which records
  of a model match a check (a conflict check, a duplicate search) as existence-only hits (id and model key), reading the
  primary key only, counting nothing, at most `limit` hits, under the records the caller may see or only learn exist
  (`IamVisibilityFilterDriver.existenceConditionsFor`, `see` or `exists`, followed relations included). Add
  `assertFieldsReadable` (`.`): a count, sum or other aggregate over or filtered on a hidden field is refused, so filtered
  aggregates apply the same field policy as reads on top of the row policy `CrudService` already ANDs (STA-933).
- 2787c1e: Add `@stackra/iam`: the `Permissions`, `Permission` (L0 to L4, `.system()`), `Policy<M>` and `Role({ grants })` kinds,
  `Decision`, `Risk` and `SystemRole`, the embedded policy decision point (scoped grants that inherit downward, explicit
  deny with `@stackra/rules` conditions and audiences that name `@stackra/segments`' `SegmentRef`, record
  visibility and `visibleCondition`, the delegation bound), the action pipeline's
  `AccessControl` driver, the scope package's `GrantedScopes` driver, the record-visibility query filter
  (`IamVisibilityFilterDriver` for `@stackra/database`'s `VisibilityFilter` and `registerVisibility`, `./node`),
  `usePermission` (`./react`) and `actors` (`./testing`); `@stackra/clients` types an action ref's `risk` as `Risk`.
- 3312ef3: Add the production `StorePolicySourceDriver` over the new `PolicySnapshotStore` port (with
  `MemoryPolicySnapshotStoreDriver` and `decodePolicySnapshot` for event payloads); field-level rules (`FieldRule`,
  `FieldAccess`, `pdp.fieldAccess`, `redactFields`, `assertFieldsWritable`); conditions on dimensions another service owns
  (`registerDimensions`, the `DimensionValues` port, fail closed); time-boxed break-glass (`BreakGlassGrant`,
  `breakGlassGrant`, `AccessReason.BreakGlass`, `DenyRule.breakable`); existence-only hits (`Capability.Exists`,
  `existenceHit`); and restricted permissions that are never self-granted (`Permission.Lx.restricted()`,
  `Grant.grantedBy`, `canDelegate(..., { to })`).
- f0c9f64: Policy snapshots are tenant-scoped: `PolicySnapshotStore.read` and `write` take the tenant, and
  `StorePolicySourceDriver` reads under the actor's tenant. Add the durable `PostgresPolicySnapshotStoreDriver` in
  `./node` with its `iam.policy_snapshots` migration (forced tenant equality policy), and `PolicySnapshotIntakeService`,
  the body of the listener that decodes and stores the IAM service's snapshot event (STA-815). Roles may hold permission
  selectors: `@read` and `@risk:<level>`, optionally behind a prefix, never picking a system or restricted permission for
  a grant (STA-818, ADR 0407).
- 074d3e8: Report dimensions and measures take a `permission` and a `dataClass`. The report runner checks the caller's column
  permissions through the decision point and drops what it may not see (a classified column needs a permission; a formula
  over a hidden measure hides too); a filter on a hidden column is forbidden. `@stackra/iam` adds `hiddenColumns` and
  `ColumnRule`.
- 2babf37: Ship the `X$` schema of each contract type a shape field names (STA-1284): `Address$`, `ScopeRef$`, `Actor$`,
  `Signature$` and `SignerPublicKey$` from `@stackra/validation`; `IsoDate$`, `HijriDate$`, `WorkingWeek$` and the
  `WorkingWeek` type from `@stackra/calendar`; `CustomFieldDefinition$` and `CustomFieldValue$` from `@stackra/content`;
  `ImportChange$` and `RowError$` from `@stackra/data-transfer/contracts`; `PromotionDiff$` from
  `@stackra/settings/contracts`; `Audience$` from `@stackra/iam/contracts`. `Condition$` already ships from
  `@stackra/rules`.

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
- ca44233: Breaking renames for unique public names (STA-1383): `@stackra/rules` `Decision` is `RuleDecision` (iam's `Decision`
  is the allow or deny enum) and `Facts` is `RuleFacts` (ai's `Facts` is the facts kind base). Importers are updated.
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
- Updated dependencies [bc4acfc]
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
- Updated dependencies [6bb8ea8]
- Updated dependencies [e45cd73]
- Updated dependencies [6006b78]
- Updated dependencies [483eb44]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [6f2c1f7]
- Updated dependencies [3d080e7]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
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
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [f7a2d36]
- Updated dependencies [67aa168]
- Updated dependencies [0a96532]
- Updated dependencies [49c3553]
- Updated dependencies [c21a223]
- Updated dependencies [2787c1e]
- Updated dependencies [ca44233]
- Updated dependencies [376a093]
- Updated dependencies [93fa8f1]
- Updated dependencies [89548ea]
- Updated dependencies [2787c1e]
- Updated dependencies [a31d463]
- Updated dependencies [158f6cf]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [fd13f0e]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [c3ff8a7]
- Updated dependencies [3e2fc84]
- Updated dependencies [5e8114b]
- Updated dependencies [2c0ea71]
- Updated dependencies [e344058]
- Updated dependencies [2787c1e]
- Updated dependencies [a65c6bc]
- Updated dependencies [ab9cc36]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/database@0.1.0
  - @stackra/model@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/scope@0.1.0
  - @stackra/testing@0.1.0
  - @stackra/validation@0.1.0
  - @stackra/rules@0.1.0

Written by Changesets on release; never edited by hand.
