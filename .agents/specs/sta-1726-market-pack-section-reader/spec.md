# Feature Specification: a typed market-pack section reader for services

**Feature Branch**: `figentra/sta-1726-market-pack-section-reader`

**Created**: 2026-10-31

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-1726

**Clarifications status**: complete

**Input**: OS · Services A (figentra/billing#2): billing needs per-Market defaults from the market pack (dunning
schedule, grace days, tax-inclusive display, currency rounding) and has no reader it can inject, so it falls back to
settings defaults. Ask: an injectable reader in `@stackra/market-packs` that returns a Market's resolved values for a
typed section, with the overlay order packs already use (base → region → market).

## Impact

- **Apps touched**: none
- **Services touched**: none in core (billing adopts it in OS)
- **Packages touched**: packages/foundation/market-packs (the `ResolvedPackSource` port, a test, README)
- **Cross-service events**: none
- **Tenancy and data**: none (pack data is signed, public market facts)
- **Secrets**: none
- **ADR needed**: no (extends ADR 0418's resolved-pack source)
- **New dependencies**: none (`@stackra/validation` and `@stackra/support` are already dependencies)
- **Deploy modes**: same everywhere
- **Licence tier**: free
- **Docs to update**: market-packs README
- **Lane**: full
- **Change risk**: R1 (an added method on an existing port; every driver gets it, none changes)

## Questions answered

1. **Is there already a reader?** Partly: `ResolvedPackSource` is an injectable port (drivers `store` and `memory`),
   and `valueFor(market, key)` returns one key's value through `resolvePack`, which applies the overlay order (the
   market's base pack, then each overlay down its code, `eu` → `eu-de`, then pins and sections). What is missing is a
   typed, many-key read, so services stop assembling keys by hand.
2. **The API.** A concrete method on the port, so every driver has it:
   `sectionFor(market, Section, options?)`, where `Section` is a `Schema` class with a
   `static readonly packPrefix`. Each field `fieldName` reads the key `<packPrefix>.<field_name>` (snake_case, the pack key convention). The values in force that day (UTC today by
   default, `options.on` otherwise) go to `Section.create(...)`, so a key no layer has takes the field's default and the
   result is the typed, validated Schema instance.
3. **One resolve.** The pack is resolved once per call (`resolvePack` over `packs()`), not once per key.
4. **Errors.** `PackNotFoundError` and `PackRejectedError` pass through as for `valueFor`. A value that fails the
   section's schema throws the validation error from `create`: pack values are checked at signing against the section
   schemas, so a mismatch is a deployment fault, not a user error.
5. **Pins and sections.** `options` takes the tenant's pins and product sections, as `ValueForOptions` already does.
6. **Who binds it?** Nobody new: a service that declares `@stackra/market-packs` already gets `ResolvedPackSource`
   bound by its configured source driver.
7. **Reuse.** Notifications' and integrations' market-pack provider defaults could move to it later; out of scope here.

## Decisions

- **Q1** (leader, 2026-10-31): the prefix is a static `packPrefix` on the Section class, with no per-call prefix, so
  it sits beside the schema and a caller cannot pick the wrong one.

## Requirements

- **FR-1** `ResolvedPackSource.sectionFor(market, Section, options?)` returns `Section.create(values)`, with
  `values[field]` = the value of `<Section.packPrefix>.<snake(field)>` in force on the day, for every field of the Section's schema
  that some layer has.
- **FR-2** A field no layer has takes its Schema default; a required field with no value fails as `create` fails.
- **FR-3** One `resolvePack` per call; overlay order, pins and sections exactly as `valueFor`.
- **FR-4** Tests on the memory driver: a base and an overlay where the overlay overrides one key, a default for a
  missing key, a dated entry not yet in force, and a value that fails the schema.

## Status history

- 2026-10-31: Draft → Clarified (questions answered from market-packs' port and resolvePack)
- 2026-10-31: Clarified → Planned (plan.md) — Approved by leader 2026-10-31
- 2026-10-31: Planned → Tasked (tasks.md; built in the same commit)
