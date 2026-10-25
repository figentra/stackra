# Feature Specification: `@stackra/market-packs`, the market-pack loader

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: The "Market-pack loader (`@stackra/market-packs`)" row of `notes/handover/stackra-package-needs.md` (new, no
home named, ADR needed): load signed, content-hashed market packs; overlays (`eu` then `eu-de`, `ae` then `ae-difc`);
dated values; "value of X for market M on date D"; pin per tenant to a major line; pack status (draft, beta, live,
retired); reviewer sign-off per rule in a pack version and a launch checklist per pack and product (Juristra
CAP-pack-review, CAP-pack-launch-gate); floors exposed to settings and facts to rules. Pack content is data: OS owns
base packs, products own their sections. Sources: owner principle of 2026-10-25, `config-model.md` section 1, draft
ADR 0363 in `notes/handover/adr-hardcoding-findings.md`.

## Impact

- **Apps touched**: none
- **Services touched**: none (OS pricing, invoicing, identity, verification, notifications, geography and tenancy
  consume it later)
- **Packages touched**: `packages/foundation/market-packs` (new)
- **Cross-service events**: none
- **Tenancy and data**: none stored; packs and tenant pins are passed in
- **Secrets**: none. Trusted public keys are configuration; the signing key is held by the caller of `signPack`
- **ADR needed**: yes, ADR 0370 (Proposed); it settles open question 1 of draft ADR 0363 (the pack home)
- **New dependencies**: none; `zod` from the default catalog, `@stackra/contracts` and `@stackra/errors` through
  `workspace:*`; SHA-256 and Ed25519 from Web Crypto
- **Deploy modes**: same in all; isomorphic and offline
- **Licence tier**: free (MIT)
- **Docs to update**: the package README and AGENTS; ADR 0370
- **Lane**: full (a new package)
- **Change risk**: R3 (legal floors, tax rates and provider choice for every market flow through it)

## Clarifications

### Session 2026-10-25

- Home: a new package, not part of `@stackra/settings`. Settings is `state` tier and per-scope; packs are signed,
  versioned, per-market data also read by the rules engine and tills. Category `foundation` (pure mechanism, no
  persistence, isomorphic).
- Signing: Ed25519 over the SHA-256 hex of the canonical JSON, keys named by id, trusted public keys passed in.
  The `@stackra/assets` content-hash row is separate; this package needs only the bytes.
- Product sections: a pack with `section` set; keys under `<section>.`; it follows its base pack's major line.
- Pins: a major line or one exact version (per-firm rollback, CAP-pack-review).
- Overlay floors: an overlay value replaces its parent's while in force; which pack wins for a tenant active in two
  markets stays with ADR 0363 open question 3 (not in this package).
- Reviews and the checklist are signed with the version: completing an item is a new patch version.
- The "Conflicts to settle" recommendations (#2 one-time codes in validation, #3 registry in devices, #4 e-signature in
  documents, #6 loyalty points in loyalty-kit) do not touch this row.

## User Scenarios & Testing

### User Story 1 - A service starts only with verified packs (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a pack signed by a trusted key, **When** `verifyPack` runs, **Then** it returns the pack.
2. **Given** a shipped pack with one changed value, **When** it is verified, **Then** it is refused with
   `hash_mismatch`.
3. **Given** an unknown key id or another key's signature, **When** it is verified, **Then** it is refused with
   `key_unknown` or `signature_invalid`.

### User Story 2 - The value of X for market M on date D (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a rate dated to change on 1 July, **When** the value is read on 30 June and on 1 July, **Then** each date
   gets its own value.
2. **Given** an overlay with an entry in force only in January, **When** the value is read in February, **Then** the
   parent's value shows through, naming the parent market and version.
3. **Given** a tenant pinned to line 1 while line 2 is live, **When** the market resolves, **Then** the highest live
   1.x version is served; an exact pin serves that version.

### User Story 3 - Floors and facts (Priority: P1)

**Acceptance Scenarios**:

1. **Given** floor entries in a parent and an overlay, **When** `floorsOn` runs, **Then** each floor in force is
   listed with its bound, law, market and version.
2. **Given** a resolved market, **When** `factsOn` runs, **Then** a plain key-to-value record is returned.

### User Story 4 - Review and launch gate (Priority: P2)

**Acceptance Scenarios**:

1. **Given** a draft with keys lacking a sign-off, **When** `unreviewed` runs, **Then** those keys are listed once.
2. **Given** a beta overlay and an open checklist item for the product, **When** `launchGate` runs, **Then** it is not
   ready and names the layer and item.

## Requirements

- **FR-001**: `package.json` names `@stackra/market-packs` at `packages/foundation/market-packs`, `exports` lists only
  `.`, `turbo.jsonc` carries `tier:lib`, dependencies are `@stackra/contracts`, `@stackra/errors` (`workspace:*`) and
  `zod` (`catalog:`).
- **FR-002**: `.` exports exactly `MarketPack$`, `SignedPack$`, `FloorBound`, `PackRejection`, `PackStatus`,
  `PackNotFoundError`, `PackRejectedError`, `contentHash`, `factsOn`, `floorsOn`, `launchGate`, `resolvePack`,
  `signPack`, `unreviewed`, `valueOf`, `valuesOn`, `verifyPack` and the types `LaunchGate`, `MarketPack`, `PackEntry`,
  `PackValue`, `ResolveOptions`, `ResolvedPack`, `ResolvedValue`, `SignedPack`, `TrustedKeys`.
- **FR-003**: Packs are signed and content-hashed; a pack whose shape, hash, key or signature fails is refused.
- **FR-004**: Overlays resolve root first; a later layer wins per key while its entry is in force.
- **FR-005**: Entries are dated (`from`, optional `until`, inclusive); the latest start in force wins.
- **FR-006**: Tenants pin per market to a major line or an exact version; only accepted statuses are served.
- **FR-007**: Floors carry a bound and a law and are exposed with their pack; facts are exposed as a plain record.
- **FR-008**: Reviewer sign-off per key per version and a launch checklist per pack and product feed `launchGate`.
- **FR-009**: Product sections keep their keys under their prefix and follow the base pack's major line.
- **FR-010**: No market, value, provider or law is written in source; tests use made-up markets.
- **FR-011**: Every source file opens with the Stackra file contract and has one exported declaration with TSDoc;
  every test sits in `__tests__/` and imports `@stackra/testing`.

## Success Criteria

- **SC-001**: The package, its spec, its changeset and ADR 0370 exist.
- **SC-002**: Every public symbol has a test beside it (run later in the testing workflow; owner mode).
