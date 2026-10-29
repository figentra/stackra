# @stackra/ledger

## 0.1.0

### Minor Changes

- dddbbcd: `Journal` writes extra typed model fields beside its own five: `@Journaled({ extra: ["locationId", "lotId"] })` lists
  them, `JournalEntry.extra` fills them (typed by the model), `find`, `lines` and `reverseWhere` read them back, and a
  reversal keeps its original's. An unlisted extra key is a `TypeError` before any write (STA-918).
- 975a6c1: Add the `./node` entry: the database-bound `Journal` service and the `journalOf` token move there, so `.` keeps only
  `Journaled`, `UnbalancedPostingError` and the types and loads in any runtime. Import `Journal` from
  `@stackra/ledger/node`. Add the `currency` field to the `@Journaled` facet: a posting's lines share one ISO 4217
  currency (else `UnbalancedPostingError`, which now carries `currencies`) and balances are per currency.
- 2787c1e: Add `@stackra/ledger`: `Journal<M>` over an append-only entry model (idempotent appends, balances derived from entries,
  debits refused below a balance floor, set-based reversals cut at the floor, balanced postings), the `@Journaled` facet,
  the `journalOf` token and `UnbalancedPostingError`.
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

- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [bc4acfc]
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
- Updated dependencies [2787c1e]
- Updated dependencies [484dc58]
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
- Updated dependencies [914465a]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [0a20a9f]
- Updated dependencies [d5f5acf]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [ae9621e]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [f746759]
- Updated dependencies [a31d463]
- Updated dependencies [158f6cf]
- Updated dependencies [47554e7]
- Updated dependencies [e756399]
- Updated dependencies [c3ff8a7]
- Updated dependencies [3e2fc84]
- Updated dependencies [5e8114b]
- Updated dependencies [2c0ea71]
- Updated dependencies [ab9cc36]
- Updated dependencies [8a1be69]
- Updated dependencies [d19a3d5]
  - @stackra/locking@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/database@0.1.0
  - @stackra/model@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/money@0.1.0

Written by Changesets on release; never edited by hand.
