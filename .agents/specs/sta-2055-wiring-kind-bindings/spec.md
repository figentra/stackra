# Feature Specification: gen binds Menu, Shortcut, Store, Bridge and ExtensionPoint; a config override keeps its base's key

**Feature Branch**: `figentra/sta-2055-wiring-kind-bindings`

**Created**: 2026-11-03

**Status**: Clarified

**Tier**: feature

**Approver**: leader

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-2055

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: User description: "Work package wp-03 of the gen coverage path. G-24: Menu, Shortcut, Store and Bridge
classes get no wiring binding, although they take constructor dependencies. G-28: ExtensionPoint is not a container
binding, yet the owner injects its point, so resolving the owner throws UnboundTokenError. G-12: a Config override is
keyed with the host's member key, so the link step adds a second row for the base with the same provide token."

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none (no app declares a kind class of the five today; `apps/mobile/src/stores/*.store.ts` are
  plain modules, not `Store` classes, so its generated wiring is unchanged)
- **Services touched**: none
- **Packages touched**: packages/developer/gen (owner: `BINDING_KINDS`, `emitWiring`); packages/foundation/container
  (its own `BINDING_KINDS`, the kinds `@Lifetime` may mark, gains `shortcut` and `extension_point`, as that file's
  contract requires); packages/commerce/loyalty-kit (one container test only). The generated, gitignored wiring of
  packages/experience/platform and packages/experience/peripherals gains their bridge rows.
- **Public contract change**: additive: the generated `#stackra/wiring` gains binding rows for the five kinds, and a
  config override's row carries its base's key. No committed `stackra.manifest.json` changes. `@stackra/container`'s
  `BINDING_KINDS` gains two codes.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none (a bridge's main-process re-checks of sender, key and permission are unchanged; this
  only makes the container able to build it)
- **Secrets**: none
- **ADR needed**: no new ADR; a dated amendment note on ADR 0294 corrects decision 16's Extension point row from `no`
  to `yes`, which ADR 0305 rules 22 to 25 and ADR 0265 decision 4 (the owner injects and calls its point) already
  imply
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: apps/docs/src/docs/adr/0294-programming-model-v3-grammar-folders-identities-and-naming.mdx (the
  amendment note); packages/developer/gen/AGENTS.md (the binding-kind list and the kind-driven lifetime)
- **Lane**: full
- **Change risk**: R2 (several members; generated wiring of every member with one of these kinds changes)

## Glossary _(full lane)_

- **Binding**: a row in the generated `wiring.bindings`: a class the container builds, with its kind, module,
  lifetime and constructor tokens.
- **Binding kind**: a kind code in gen's `BINDING_KINDS`; every class of such a kind gets a binding row.
- **Kind lifetime**: the lifetime a kind's base documents for its classes (a Bridge is built per call), used when the
  class carries no `@Lifetime`.
- **Config override**: a host's class that extends another member's config class (`declared.base.own === false`); the
  container builds the override in place of the base.
- **Host test container**: a container a member's tests build with `createTestingModule(...)` from the wiring gen's
  vitest setup registers.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - The five kinds are bindings (Priority: P1)

An author writes a `Menu`, `Shortcut`, `Store`, `Bridge` or `ExtensionPoint` class with constructor dependencies.
After `stackra gen`, the member's wiring binds it with its tokens, so `useStore`, `useShortcut`, desktop `createApp`
(which reads `kind: "bridge"` rows) and `useMenu` resolve it through the container.

**Why this priority**: today every one of these classes is unbound: `useStore` and `useShortcut` throw
UnboundTokenError, desktop `createApp` exposes no bridge, and menus fall back to `new type()` without their
dependencies.

**Independent Test**: `emitWiring` over an IR with one class of each kind prints one binding row per class.

**Acceptance Scenarios**:

1. **Given** a member with `SiteMenu`, `OpenPaletteShortcut` (injecting `PaletteStore`), `PaletteStore`,
   `PickFolderBridge` (injecting `FileSystem`) and `OrderExtensionPoint`, **When** gen writes the wiring, **Then**
   `bindings` has a row for each with kinds `menu`, `shortcut`, `store`, `bridge` and `extension_point` and their
   constructor tokens.
2. **Given** a Bridge without `@Lifetime`, **When** gen writes the wiring, **Then** its row says
   `lifetime: Lifetime.Request`; a Bridge with `@Lifetime(Lifetime.Transient)` keeps `Lifetime.Transient`.
3. **Given** a Store without `@Lifetime`, **When** gen writes the wiring, **Then** its row has no `lifetime`, so the
   container builds it once (a singleton).

---

### User Story 2 - An owner that injects its extension point resolves (Priority: P1)

loyalty-kit's `AccountService` injects `LoyaltyKitExtensionPoint`. A test that builds loyalty-kit's container gets an
`AccountService`.

**Why this priority**: today resolving any owner of a point throws UnboundTokenError, so loyalty-kit's
`AccountService` and `RedeemPointsWorkflow` cannot be built by a container.

**Independent Test**: `createTestingModule(LoyaltyKitModule).useDrivers("memory")` with overrides only for the
tokens that need a running request, then `get(AccountService)`.

**Acceptance Scenarios**:

1. **Given** loyalty-kit's generated wiring, **When** a test container resolves `AccountService`, **Then** it gets an
   instance whose point is a `LoyaltyKitExtensionPoint`, and no UnboundTokenError is thrown.

---

### User Story 3 - A config override keeps its base's key (Priority: P1)

A host `web` overrides `@stackra/loyalty-kit`'s `LoyaltyKitConfig` with its own `LoyaltyKitConfig extends
BaseLoyaltyKitConfig`. The wiring has one config row, keyed `loyalty_kit`, providing the base and built from the
override; env, runway and layer values for `loyalty_kit` reach the override.

**Why this priority**: today the row is keyed `web.loyalty_kit` and the link step adds a second `loyalty_kit` row with
the same provide token, so the container sees two rows for one token and the configured values miss the override.

**Independent Test**: `emitWiring` over a host IR with the override and the kit's manifest in `dependencies`.

**Acceptance Scenarios**:

1. **Given** the host override above and a binding that injects the kit's `LoyaltyKitConfig`, **When** gen writes the
   wiring, **Then** `config` has exactly one row providing `BaseLoyaltyKitConfig`, with `key: "loyalty_kit"` and
   `override: LoyaltyKitConfig`.
2. **Given** the override's schema has a `driver_name` field, **When** gen writes the wiring, **Then** the driver
   table's `selectedBy` reads `config:loyalty_kit.<field>`, not `config:web.loyalty_kit.<field>`.

### Edge Cases

- **EC-01**: A config override whose base package's manifest has no `config` section (an older manifest): the key is
  `configKeyOf(base.name, <base package's member key>)`, the same rule the package used.
- **EC-02**: A member's own config class (`base.own === true` or no base) keeps `configKeyOf(name, ir.member)`;
  nothing changes for it.
- **EC-03**: A Bridge class in a package (`@stackra/platform`, `@stackra/peripherals`) is bound in that package's own
  wiring, which only its own tests register; its tokens follow the existing rule (a token from an undeclared
  `@stackra/*` package is left out of a package candidate's tokens, never of a binding's).
- **EC-04**: An explicit `@Lifetime` on a Bridge or Store wins over the kind lifetime.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE gen `BINDING_KINDS` SHALL include `menu`, `shortcut`, `store`, `bridge` and `extension_point`, so
  `emitWiring` prints a binding row with its constructor tokens for every class of those kinds.
- **FR-002**: WHEN a `bridge` class carries no `@Lifetime` THE wiring SHALL print `lifetime: Lifetime.Request` for
  it; WHEN any binding class carries `@Lifetime` THE wiring SHALL print that lifetime.
- **FR-003**: WHEN a `store` class carries no `@Lifetime` THE wiring SHALL print no lifetime for it, so the container
  builds it as a singleton.
- **FR-004**: WHEN a member's class injects the member's own extension point THE member's wiring SHALL bind the point,
  so a container built from that wiring resolves the class.
- **FR-005**: WHEN a member declares a config override of another member's config class THE wiring SHALL key its row
  with the base's key (the base package's manifest `config` entry for that class, else `configKeyOf(base.name, base
member)`) and provide the base.
- **FR-006**: WHEN a binding or driver injects a package config class that the member overrides THE link step SHALL
  add no second row for that key.
- **FR-007**: WHEN a config override's schema selects a driver THE driver table's selector SHALL use the base's key.
- **FR-008**: THE `@stackra/container` `BINDING_KINDS` SHALL include `shortcut` and `extension_point`, so `@Lifetime`
  may mark every binding kind gen binds.
- **FR-009**: THE ADR 0294 page SHALL carry a dated amendment note that decision 16's Extension point row is a binding.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN gen writes the wiring of a member with one class of each of the five kinds THE wiring SHALL bind
  each one with its kind and constructor tokens.
- **AC-002**: WHEN a Bridge has no `@Lifetime` THE wiring SHALL bind it with `Lifetime.Request`, and a Store with no
  `@Lifetime` with no lifetime (singleton).
- **AC-003**: WHEN a loyalty-kit test container resolves `AccountService` THE container SHALL return an instance and
  throw no UnboundTokenError.
- **AC-004**: WHEN a host overrides a package's config class THE wiring SHALL hold one config row with the base's key
  and provide token, and no second row for that key.
- **AC-005**: THE gen `BINDING_KINDS` test SHALL pin the five codes, and the container's `BINDING_KINDS` SHALL hold
  every code gen binds that `@Lifetime` may mark.

## Success Criteria _(mandatory)_

- **SC-001**: `emit-wiring.function.test.ts` proves AC-001, AC-002 and AC-004 — verified by: unit
- **SC-002**: loyalty-kit's `account.service.test.ts` resolves `AccountService` from the test container — verified
  by: unit
- **SC-003**: the gen golden fixtures (`golden.test.ts`) and the typecheck and tests of gen, container, loyalty-kit,
  platform and peripherals pass on ci-box after `stackra gen` — verified by: unit

## Out of scope

- A Store's client `Storage` dependency, its derived key and `registerStores` (G-25, wp-63): a store with no
  constructor is bound with no tokens and lives in memory, as it does when built by hand today.
- A Shortcut's derived key, label and `registerShortcuts` (G-26).
- A hosted package's extension points and extensions in its manifest and its host's wiring (G-29, wp-102), and
  registering and connecting extensions (G-5, wp-62). This spec binds a member's own point only.
- The desktop main-process wiring and the bridge preload allow-list (G-27, wp-84).

## Assumptions

- A class without `@Lifetime` is a singleton (`@stackra/container` `recipeFor`), so a Store needs no lifetime row.
- An ExtensionPoint's slots are created by its field initialisers and take no constructor tokens, so its binding row
  has `deps: []`.
- The base package's member key is found the same way the link step finds it (`memberOf(from)`: the dependency whose
  package the specifier names, else the snake-cased package name).

## Amendments

None.

## Status history

- 2026-11-03 · — → Draft · claude (wp-03 executor) · created from the gen coverage audit (G-24, G-28, G-12)
- 2026-11-03 · Draft → Clarified · claude (wp-03 executor) · no open question: lifetimes from the kind bases'
  docblocks and the container's default; the override key from ADR 0294 decision 20 and `configKeyOf`'s contract
