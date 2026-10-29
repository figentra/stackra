# @stackra/repo-checks

## 0.1.0

### Minor Changes

- 6a03936: Member metadata for people and agents (ADR 0453 decision 11, amendment of 2026-10-27, STA-1072). `@stackra/skills`
  adds the `package` kind's `tier`, `category`, `runtimes` and `summary` to `StackraManifest` and
  `STACKRA_MANIFEST_SCHEMA`, with the vocabularies `StackraTier`, `StackraCategory` and `StackraRuntime`.
  `@stackra/repo-checks` adds `checkMemberMetadata` (keywords, repository, homepage, bugs, author, engines, the `stackra`
  field against the folder and its turbo tags), `npmMetadataFor`, `turboTagsFor` and `MEMBER_METADATA`, run by the
  `structure` phase in the Stackra repository. `stackra new` writes the field, the tags and `--summary`.
- 954bf08: Enforce the ORM boundary and the raw SQL reason (gap mo23, ADR 0097 amendment of 2026-10-29). `boundaries.jsonc`
  bans `@mikro-orm/*` imports outside `@stackra/database`; `@stackra/model` may take `Collection`, `Ref` and `Reference`
  from `@mikro-orm/core`, and its ORM adapters the rest. `checkRawSql` (rule `raw-sql` in the structure phase) holds
  every raw SQL call in member source to a `// raw-sql:` reason (ADR 0160), with `RAW_SQL_BASELINE` as a ratchet for
  the calls that had none.
- 512884e: <!-- Purpose: release note for stackra-189: the Pro dependency rule after @stackra-pro/ui left figentra/stackra. Boundary: changelog text only. Runtime: none. Governing contract: ADR 0461 (decision 3), ADR 0310. -->
  
  No member of figentra/stackra may depend on an `@stackra-pro/*` package, apps included (`PRO_SCOPE`, ADR 0461):
  `@stackra-pro/ui` moved to figentra/stackra-pro. HeroUI Pro (`PRO_DEPENDENCIES`: `@heroui-pro/react`,
  `heroui-native-pro`) stays apps-only. The Pro wrapper's Keygen publishing check and the `PRO_WRAPPER` export are
  removed, `expectedName` no longer maps `packages/design-system/ui-pro` to `@stackra-pro/ui`, and
  `SEVEN_LANGUAGE_MEMBERS` drops `packages/design-system/ui-pro`.

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
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- 830ea4a: New `@stackra/native-customer-display` (ADR 0478): the `StackraCustomerDisplay` Expo module (an Android `Presentation`
  and an iPad external-display scene, moved unchanged from the mobile app's `src/native-sources/customer-display/`) with
  `ExternalCustomerDisplayDriver` behind the unchanged `CustomerDisplay` port, and its config plugin. `@stackra/peripherals`:
  `ExternalCustomerDisplayDriver` leaves the `.` entry for the new package (same driver name `external`); import it from
  `@stackra/native-customer-display`. `@stackra/repo-checks`: `checkNativeModules` no longer exempts the mobile app's
  customer display (STA-1533).
- de58cb5: `checkGitignore` accepts `**/.stackra/*`, the line that ignores the generated folder in every member.
- 3047b44: json-configs allows a product's `assets/landing/*.json` page documents: `stackra dev` seeds the os/landing shell
  with the content folder's `.json` files, so they stay JSON like lang catalogues.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.

Written by Changesets on release; never edited by hand.
