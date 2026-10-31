# @stackra/achievements

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [cfdcdf8]
- Updated dependencies [2d5a888]
- Updated dependencies [1a9259b]
- Updated dependencies [5fa1a15]
- Updated dependencies [9085c41]
  - @stackra/actions@0.2.0
  - @stackra/database@0.2.0
  - @stackra/errors@0.2.0
  - @stackra/iam@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/rules@0.2.0
  - @stackra/integrations@0.2.0
  - @stackra/content@0.2.0
  - @stackra/documents@0.2.0
  - @stackra/outbox@0.2.0
  - @stackra/model@0.2.0
  - @stackra/events@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- fa0ed99: `AwardPass` (`Pass({ key: "award" })`) and `AwardPassSource` in `./node`: the award wallet pass content from the
  certificate fields (kind name, level, period, grant date, short code, verify URL as QR code), with `passes.award.*`
  labels in seven locales under `assets/lang` (now in the published files). New dependency: `@stackra/integrations`.
- 6f3ab26: Add `@stackra/achievements`: award kinds kept as scope data, awards granted by hand or automatically when a kind's
  `@stackra/rules` criteria match a recipient's facts, revoke, an opaque verify token resolved across scopes with an SVG
  QR code, certificate fields for `@stackra/documents`, and `AwardGranted` and `AwardRevoked` integration events.
- b0eb154: Add the public `VerifyAwardQuery` (`award.verify`, by token or short code), a 12-character typed code per award with
  `normalizeAwardCode` and `AwardService.verifyCode`, a unique index of live awards per kind, recipient and period
  (a lost race is `period_taken`), and `AwardService.renderCertificate` through `@stackra/documents` (STA-717, ADR 0432).

### Patch Changes

- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
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
- Updated dependencies [072a443]
- Updated dependencies [0abe92d]
- Updated dependencies [bc4acfc]
- Updated dependencies [ae3d280]
- Updated dependencies [99665bb]
- Updated dependencies [8ead1a8]
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
- Updated dependencies [6da76a2]
- Updated dependencies [a45aec8]
- Updated dependencies [281ec71]
- Updated dependencies [830898b]
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
- Updated dependencies [6f2c1f7]
- Updated dependencies [3d080e7]
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
- Updated dependencies [09080ac]
- Updated dependencies [0a20a9f]
- Updated dependencies [2787c1e]
- Updated dependencies [3d34a5d]
- Updated dependencies [9ab18b4]
- Updated dependencies [d5f5acf]
- Updated dependencies [0e7eb1f]
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
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [f7a2d36]
- Updated dependencies [67aa168]
- Updated dependencies [0a96532]
- Updated dependencies [49c3553]
- Updated dependencies [c21a223]
- Updated dependencies [2787c1e]
- Updated dependencies [ca44233]
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
- Updated dependencies [ab9cc36]
- Updated dependencies [f04fec9]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [fc51f13]
- Updated dependencies [c7e6988]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/integrations@0.1.0
  - @stackra/events@0.1.0
  - @stackra/outbox@0.1.0
  - @stackra/content@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/database@0.1.0
  - @stackra/model@0.1.0
  - @stackra/documents@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/iam@0.1.0
  - @stackra/validation@0.1.0
  - @stackra/rules@0.1.0

Written by Changesets on release; never edited by hand.
