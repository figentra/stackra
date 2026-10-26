# @stackra/market-packs

The market-pack loader. A market pack is versioned, signed data for one market (a country, a group such as `eu`, or
an overlay such as `eu-de` or `ae-difc`): tax, e-invoicing, legal floors, providers, calendar, formats. This package
verifies packs, resolves overlays and product sections under a tenant's pins, and answers "the value of X for market M
on date D", picks per rule kind the market of a record's subject (location, buyer, entity, tenant), and stores and
fetches signed packs by content hash. Its code holds no pack content; the draft `us` seed packs ship as data assets
(ADR 0363, ADR 0370, ADR 0385).

**Tier:** `tier:lib` (`packages/foundation/market-packs`), entry `.` only. Depends on `@stackra/assets`,
`@stackra/container`, `@stackra/contracts`, `@stackra/errors`, `@stackra/filesystem` and `zod`; isomorphic and offline. Hashing and signatures use Web Crypto (SHA-256, Ed25519).

## Entry points

| Import                  | Holds                        | Exports                        |
| ----------------------- | ---------------------------- | ------------------------------ |
| `@stackra/market-packs` | `src/core/`: isomorphic code | the symbols in the table below |

Entry barrels are generated, never authored (ADR 0294 decision 15); until `stackra gen` writes them (STA-339),
`src/core/index.ts` is a stand-in barrel.

## What is here

| Symbol                                                                      | Use                                                                                                           |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `MarketPack$`, `MarketPack`, `PackEntry`, `PackValue`                       | the shape of one pack version: market, section, `extends`, version, status, dated entries, reviews, checklist |
| `SignedPack$`, `SignedPack`, `TrustedKeys`                                  | a pack as shipped: content, SHA-256 hash, Ed25519 signature; the public keys accepted                         |
| `signPack`, `contentHash`                                                   | the build step: check, hash and sign a reviewed pack                                                          |
| `verifyPack`, `PackRejectedError`, `PackRejection`                          | the load step: shape, hash and signature checks; a failing pack is refused                                    |
| `resolvePack`, `ResolveOptions`, `ResolvedPack`, `PackNotFoundError`        | overlays root first, pins per market, accepted statuses, product sections                                     |
| `valueOf`, `valuesOn`, `ResolvedValue`                                      | the value of a key on a date, with the market and version that set it                                         |
| `floorsOn`, `FloorBound`                                                    | the legal floors in force, with bound and law, for the settings resolver and rules                            |
| `factsOn`                                                                   | the values in force as a plain record, a fact source for `@stackra/rules`                                     |
| `unreviewed`, `launchGate`, `LaunchGate`                                    | reviewer sign-off per key, and the launch checklist per pack and product                                      |
| `PackStatus`                                                                | `draft`, `beta`, `live`, `retired`                                                                            |
| `MarketContext`, `MarketRecord`, `PackSubject`, `SubjectMarketMissingError` | `packFor(record, ruleKind)`: the resolved market of the subject the pack names for the rule kind              |
| `PackStore`, `FilesystemPackStoreDriver`, `fetchPacks`                      | signed packs stored and fetched by content hash, verified on load                                             |
| `readPackAssets`                                                            | packs shipped as `data/` assets, read through `AssetLibrary` after the manifest hash check                    |

## Use

```ts
import { PackStatus, floorsOn, resolvePack, valueOf, verifyPack } from "@stackra/market-packs";

// At start-up: every shipped pack must verify, or the service does not start.
const packs = await Promise.all(shipped.map((input) => verifyPack(input, trustedKeys)));

// Per tenant: its market, its pins and the product sections it needs.
const resolved = resolvePack(packs, tenant.market, {
  pins: tenant.packPins,
  sections: ["commerce"],
});

valueOf(resolved, "consumer.withdrawal_days", today); // { value, market, version, floor? }
floorsOn(resolved, today); // what no setting may cross, with the law that set it
```

## Draft seed packs

`assets/data/packs/` holds the `us` base pack and the seven state overlays of the first launch list (`us-ny`, `us-nj`,
`us-ca`, `us-tx`, `us-il`, `us-mi`, `us-fl`), all `draft` with a `counsel_review` checklist item and no sign-offs:
the federal and state holiday sets, a default working week, `calendar.uncertain_days`, `calendar.leap_birthday`
and the subject of each rule kind. None of it is served until it is reviewed, signed and promoted.

## Rules

- **Overlays.** `extends` names the parent market, at any depth (`us` → `us-ca` → `us-ca-sf`); a loop is refused. A
  layer's value wins over its parent's only while its own entry is in force; otherwise the parent's value shows
  through. A section on an overlay (`us-ca-sf` / `restaurant`) overlays the parent's section.
- **Subjects.** `subjects` maps a key or key prefix to `location`, `buyer`, `entity` or `tenant`; the longest match
  wins and an overlay may restate one. No match means the tenant's market.
- **Dated values.** An entry is in force from `from` through `until`, both inclusive. When two entries of one key cover
  a date, the later start wins. A change on 1 July is a dated entry, published ahead of time.
- **Pins.** A pin is a major line (`"2"`) or one exact version for a rollback (`"2.1.0"`), per market in the chain. An
  unpinned market takes its highest accepted version. Only `live` is accepted unless `statuses` says otherwise (a
  sandbox may accept `beta`).
- **Sections.** A product's section of a market follows its base pack's major line; its keys start with
  `<section>.`, so it never overwrites a base value.
- **Floors.** A floor entry carries `bound` (`min` or `max`) and `law`. This package exposes floors; the settings
  resolver and the rules engine apply them.
- **Hash.** SHA-256 of the canonical JSON (keys sorted at every depth) of the pack exactly as shipped.

## Tasks

| Task            | Command                                         |
| --------------- | ----------------------------------------------- |
| `build`         | `tsdown`                                        |
| `typecheck`     | `tsc --noEmit`                                  |
| `lint`          | `oxlint .`                                      |
| `test`          | `vitest run`                                    |
| `test:coverage` | `vitest run --coverage` (shared gate: 80/80/70) |
| `format`        | `oxfmt --write .`                               |
| `format:check`  | `oxfmt --check .`                               |
| `clean`         | `rm -rf dist coverage .turbo`                   |

Run one with `pnpm turbo run <task> --filter=@stackra/market-packs`.
