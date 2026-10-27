# @stackra/market-packs

<!--
Stackra file contract:
Purpose: the package's reader guide: market packs, signing and verifying, resolving (sections without a base pack
         included), values and floors (list floors included), storage and the base-pack keys.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0370; ADR 0385; ADR 0417; ADR 0418; ADR 0455.
-->

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

| Symbol                                                                      | Use                                                                                                                                                                                                   |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MarketPack$`, `MarketPack`, `PackEntry`, `PackValue`                       | the shape of one pack version: market, section, `extends`, version, status, dated entries, reviews, checklist                                                                                         |
| `SignedPack$`, `SignedPack`, `TrustedKeys`                                  | a pack as shipped: content, SHA-256 hash, Ed25519 signature; the public keys accepted                                                                                                                 |
| `signPack`, `contentHash`                                                   | the build step: check, hash and sign a reviewed pack                                                                                                                                                  |
| `verifyPack`, `PackRejectedError`, `PackRejection`                          | the load step: shape, hash and signature checks; a failing pack is refused                                                                                                                            |
| `resolvePack`, `ResolveOptions`, `ResolvedPack`, `PackNotFoundError`        | overlays root first, pins per market, accepted statuses, product sections; `requireBase: false` resolves sections with no base pack                                                                   |
| `pickPack`                                                                  | the one version of a market's base pack or section a pin and the accepted statuses allow                                                                                                              |
| `valueOf`, `valuesOn`, `ResolvedValue`                                      | the value of a key on a date, with the market and version that set it                                                                                                                                 |
| `floorsOn`, `FloorBound`                                                    | the legal floors in force, with bound and law, for the settings resolver and rules                                                                                                                    |
| `factsOn`                                                                   | the values in force as a plain record, a fact source for `@stackra/rules`                                                                                                                             |
| `unreviewed`, `launchGate`, `LaunchGate`                                    | reviewer sign-off per key, and the launch checklist per pack and product                                                                                                                              |
| `PackStatus`                                                                | `draft`, `beta`, `live`, `retired`                                                                                                                                                                    |
| `MarketContext`, `MarketRecord`, `PackSubject`, `SubjectMarketMissingError` | `packFor(record, ruleKind)`: the resolved market of the subject the pack names for the rule kind                                                                                                      |
| `PackStore`, `FilesystemPackStoreDriver`, `fetchPacks`                      | signed packs stored and fetched by content hash, verified on load                                                                                                                                     |
| `readPackAssets`                                                            | packs shipped as `data/` assets, read through `AssetLibrary` after the manifest hash check                                                                                                            |
| `PackSchemaRegistry`, `PackSchema`, `PackKeySchema`, `PackIssue`            | the publish check: every key declared by a section schema (a `*` segment declares a family), every value valid                                                                                        |
| `BASE_PACK_SCHEMAS`                                                         | the shipped schemas of `notifications.channels.*`, `notifications.prayer_holds`, `providers.*`, `imports.legacy_encoding`, `identity.national_ids`, `identity.address_format` and `ai.approval_floor` |

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

// A product's own sections before the platform's base packs exist (ADR 0455).
const sectionsOnly = resolvePack(commercePacks, "eu-de", {
  sections: ["commerce"],
  requireBase: false,
});
```

## Draft seed packs

`assets/data/packs/` holds the `us` base pack and the seven state overlays of the first launch list (`us-ny`, `us-nj`,
`us-ca`, `us-tx`, `us-il`, `us-mi`, `us-fl`), all `draft` with a `counsel_review` checklist item and no sign-offs:
the federal and state holiday sets, a default working week, `calendar.uncertain_days`, `calendar.leap_birthday`
and the subject of each rule kind. It also holds the `sa`, `ae` and `eg` base packs with only `identity.national_ids`
(SA national ID and residence permit, the Emirates ID, the Egyptian national ID) and `identity.address_format`, also
`draft` and awaiting counsel. The `us` pack carries no `identity.national_ids`: the US issues no national identity
document, and the SSN is already `identity.ssn_last_four` (default applied 2026-10-27, owner may override). None of
it is served until it is reviewed, signed and promoted.

## Base-pack keys this package declares

`BASE_PACK_SCHEMAS` holds shapes, never values; pass it to `PackSchemaRegistry.create` with the other owners' schemas.

| Key                                 | Value                                                                                           | Read by                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `notifications.channels.<category>` | channel codes, first tried first (`["whatsapp", "sms", "mail"]`)                                | OS notifications `ChannelChainService`                                     |
| `notifications.prayer_holds`        | `true` when prayer-time holds default on in the market                                          | OS notifications `PrayerHoldService`                                       |
| `providers.<capability>`            | provider codes or `{ provider, status }`, in the market's order                                 | `MarketPackProviderDefaultsDriver` (integrations)                          |
| `imports.legacy_encoding`           | the WHATWG label a CSV without UTF-8 falls back to (`windows-1256`)                             | OS data-exchange imports (through the OS loader)                           |
| `identity.national_ids`             | each identity document kind the market issues, to its `IdentifierFormat` (`NationalIdFormats$`) | `nationalId(formats)` of @stackra/validation                               |
| `identity.address_format`           | the market's address rules (`AddressFormat$`)                                                   | `address(format)` of @stackra/validation, `formatAddress` of @stackra/i18n |
| `ai.approval_floor`                 | `{ tags, tagSets, recipientLimit?, deletes, actions? }`, the market's legal AI approval floor   | `packApprovalFloorOf` of @stackra/rules                                    |

Each prefix is as narrow as its keys, so the OS service that owns a section still registers its other keys itself.

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
- **Sections without a base.** With `requireBase: false`, a market with no base pack answers with its sections alone
  (on its pin, else the highest) and nests under its code's parent (`eu-de` under `eu`); the asked-for market still
  needs a base or a section. A base pack, when present, is used as always. The default stays `true`, so a missing
  platform base pack is refused in production.
- **Floors.** A floor entry carries `bound` (`min`, `max` or `list`) and `law`. A `list` floor's value is a list: a
  value may add items but never drop one (refused goods). `overlayFloorIssues` refuses an overlay that drops an item.
  This package exposes floors; the settings resolver and the rules engine apply them.
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
