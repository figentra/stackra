# Feature Specification: the seed entry registers factory partners, hosts package seeders and runs in module order

**Feature Branch**: `figentra/sta-2061-seed-entry`

**Created**: 2026-11-03

**Status**: Draft

**Tier**: feature

**Approver**: leader

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-2061

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: Work package wp-25 of the gen coverage path, closing gaps G-38 and G-86:

- G-38: the seed entry registers no `Factory` partners, so a demo or test seeder that uses a factory fails under
  `stackra db seed`. Factory pairs are written only into the Vitest setup.
- G-86: the seed entry ignores the seeders of hosted packages, and orders seeders by file path, not by module
  dependency. Package seeders sit in `./testing` on purpose.

Evidence: `packages/developer/gen/src/core/functions/emit-runtime-entries.function.ts:97-145` (the seed entry lists
`ir.classes` of kind `seeder` and nothing else), `emit-tool-configs.function.ts:142-170` (the only
`registerModelPartners` call gen writes), `node/functions/discover-member.function.ts:217-224` (classes sorted by file).

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none. `services/example` and `services/health` have no seeders, so their generated output does
  not change.
- **Packages touched**:
  - `packages/developer/gen`: the seed entry, two new manifest sections, the shared module order, the golden `service`
    fixture;
  - `packages/commerce/loyalty-kit` and `packages/security/access-log`: their committed `stackra.manifest.json` gains the
    new sections (regenerated, not hand-edited).
- **Public contract change**: additive. `stackra.manifest.json` gains two optional sections, `seeders` and `factories`.
  The generated `.stackra/entry/seed.ts` gains factory pairs and hosted seeders. No action, query, event or export
  changes.
- **Cross-service events**: none
- **Tenancy and data**: none. Seeders write what they already write; only the order and the set change.
- **Security and privacy**: none. The seed entry is run by `stackra db seed`, whose production guard is unchanged.
  Factories load Faker lazily, so importing them in the seed entry loads no Faker until a factory runs.
- **Secrets**: none
- **ADR needed**: no. ADR 0190 (as amended by ADR 0294) already says seeders run in the order their imports imply and
  that a seeder's identity is `<module>.<profile>`; ADR 0305 rule 5 says gen registers a factory's model from its type
  argument.
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/developer/gen/README.md` (the `stackra.manifest.json` and `.stackra/entry/*.ts` rows);
  no `apps/docs` page describes the seed entry.
- **Lane**: full
- **Change risk**: R2 (an additive public contract, the manifest, and several members' committed manifests)

## Glossary _(full lane)_

- **Seed entry**: `.stackra/entry/seed.ts`, the generated file `stackra db seed` runs for a service with seeders and a
  boot (STA-1709).
- **Factory pair**: a `Factory<M>` class with its model class `M`, registered through `registerModelPartners` from
  `@stackra/database` so `Factory.new().create()` knows its model.
- **Hosted package**: a dependency of a service that commits a `stackra.manifest.json` and is not an app; the service
  wires its module, entities and actions.
- **Module order**: the module keys sorted so each comes after the modules it depends on (the edges gen already
  derives for the wiring and the manifest's `modules[].dependsOn`).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A seeder that uses a factory runs under `stackra db seed` (Priority: P1)

A service author writes `database/seeders/demo.seeder.ts` that calls `OrderFactory.new().create()`. Today it passes
in tests (the Vitest setup registers the pair) and fails under `stackra db seed`, because the seed entry never
registers the pair. After this change the seed entry registers every factory pair of the service before the seeders
run.

**Why this priority**: it is the defect: the `demo` profile (the golden tenant, ADR 0190 decision 1) is built from
factories, so without the pairs the demo profile cannot be seeded at all.

**Independent Test**: emit the seed entry of a service IR with a factory and a demo seeder; the entry imports the
factory and its model and calls `registerModelPartners([[OrderFactory, Order]])` before `runSeedEntry`. The golden
`service` fixture carries the same pair in its expected `seed.ts`.

**Acceptance Scenarios**:

1. **Given** a service with a boot, `OrderFactory extends Factory<Order>` and `ShopDemoSeeder`, **When** gen runs,
   **Then** `.stackra/entry/seed.ts` registers `[OrderFactory, Order]` with `registerModelPartners` before it calls
   `runSeedEntry`.
2. **Given** a service with seeders but no factories, **When** gen runs, **Then** the seed entry has no
   `registerModelPartners` call, and is otherwise unchanged.

---

### User Story 2 - Hosted package seeders run, in module-dependency order (Priority: P1)

A service hosts a package (for example a loyalty kit) that ships a `demo` seeder and the factories it uses from its
`./testing` entry. `stackra db seed --profile demo` on the service seeds the package's rows too, before the service's
own seeders that build on them, and the service's own seeders run in the order their modules depend on each other,
not in file-path order.

**Why this priority**: ADR 0190 says seeders run in the order their imports imply. A service's `orders` demo seeder
that reads the `catalogue` module's demo rows fails when `catalogue` sorts after `orders` by path, and a hosted
package's demo data is missing from the golden tenant entirely.

**Independent Test**: emit the seed entry of a service IR whose dependency manifest records a seeder and a factory,
and whose own modules depend on each other against their path order; the entry imports the hosted seeder and factory
from `<package>/testing`, lists the hosted seeder first, and lists own seeders in module order.

**Acceptance Scenarios**:

1. **Given** a hosted package whose manifest records `seeders` and `factories`, **When** gen runs for the host,
   **Then** the seed entry imports them from `<package>/testing`, imports each factory's model from the entry that
   exports its file, registers the pairs, and lists the package's seeders.
2. **Given** own modules `a_orders` depending on `b_catalogue`, **When** gen runs, **Then** `b_catalogue`'s seeders
   are listed before `a_orders`'s.
3. **Given** two hosted packages where the first in `package.json` depends on the second, **When** gen runs, **Then**
   the second package's seeders are listed first, and every hosted seeder before the service's own.
4. **Given** a package with seeders and factories, **When** gen writes its manifest, **Then** the manifest records a
   `seeders` section (key, module, profile, class, file) in module order and a `factories` section (class, file,
   model).

---

### Edge Cases

- **EC-01**: A service with no own seeders but a hosted package that records seeders gets a seed entry (given a boot);
  a service with neither gets none, as today.
- **EC-02**: A dependency manifest written before this change has no `seeders` or `factories` section; it contributes
  nothing and is not an error.
- **EC-03**: A dependency of kind `app` is never hosted; its sections are ignored, as `emitHostedEntities` does.
- **EC-04**: When two classes the seed entry imports share a name (an own model `Customer` and a hosted model
  `Customer`), the one imported later is aliased `Imported<Name>`, so the entry compiles. Hosted rows and pairs come
  first, so the own class is the one aliased (FR-008).
- **EC-05**: A module cycle keeps source order for the modules in the cycle (the existing `topological` behaviour);
  `module_cycle` is already refused by `checkConventions`, so a clean run never reaches it.
- **EC-06**: A factory declared without a model type argument has no partner and is not paired, as in the Vitest setup
  today.
- **EC-07**: A hosted factory whose model the package's `models` section does not list is imported from
  `<package>/node`, the package's model entry (`packageSpecifier` with no file). `emitHostedEntities` falls back to
  the bare package name instead; the seed entry does not follow it.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: WHEN gen writes the seed entry of a service THE entry SHALL register every own factory that has a model
  partner with that model through `registerModelPartners` from `@stackra/database`, before `runSeedEntry` runs.
- **FR-002**: WHEN gen writes the manifest of a member with seeders THE manifest SHALL record a `seeders` section, one
  row per seeder with `key` (`<module>.<profile>`), `module`, `profile`, `class` and `file`, in module order.
- **FR-003**: WHEN gen writes the manifest of a member with factories that have a model partner THE manifest SHALL
  record a `factories` section, one row per factory with `class`, `file` and `model` (the model's class name).
- **FR-004**: WHEN a service hosts a package whose manifest records seeders THE seed entry SHALL import each from
  `<package>/testing` and list it with its recorded key, module and profile.
- **FR-005**: WHEN a service hosts a package whose manifest records factories THE seed entry SHALL import each factory
  from `<package>/testing`, import its model from the package entry that exports the model's file (by the manifest's
  `models` section), and register the pair.
- **FR-006**: THE seed entry SHALL list hosted packages' seeders before the service's own; hosted packages in
  dependency order (a package after the hosted packages its modules depend on, ties in `package.json` order), each
  package's seeders in its manifest order; and the service's own seeders in module order, ties by file.
- **FR-007**: WHEN a service with a boot has no own seeders but hosts at least one recorded seeder THE gen run SHALL
  write the seed entry.
- **FR-008**: WHEN two names the seed entry imports clash THE entry SHALL import the later one under an
  `Imported<Name>` alias.
- **FR-009**: THE wiring's module order SHALL stay what it is today: the module edges and the topological sort move to
  shared functions that the wiring, the manifest's seeders section and the seed entry all use.

### Key Entities _(include if feature involves data)_

- **Manifest `seeders` row**: `{ key, module, profile, class, file }`; the identity `key` is the ADR 0294 seeder
  identity, recorded but not yet locked (the lock is STA-340, wp-69).
- **Manifest `factories` row**: `{ class, file, model }`; not an identity, only what a host needs to pair them.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a service declares a factory with a model and a seeder THE seed entry SHALL call
  `registerModelPartners` with that pair before `runSeedEntry`.
- **AC-002**: WHEN the golden `service` fixture declares `OrderFactory` and `ShopDemoSeeder` THE expected
  `.stackra/entry/seed.ts` SHALL import both and register `[OrderFactory, Order]`.
- **AC-003**: WHEN a hosted package's manifest records seeders and factories THE host's seed entry SHALL import them
  from `<package>/testing`, register the factory pairs and list the seeders before the service's own.
- **AC-004**: WHEN own modules depend on each other against their path order THE seed entry SHALL list their seeders in
  module-dependency order.
- **AC-005**: WHEN gen writes a package manifest with seeders and factories THE manifest SHALL hold the `seeders` and
  `factories` sections, and the committed manifests of `@stackra/loyalty-kit` and `@stackra/access-log` SHALL carry
  them as a fresh gen writes them. Their other drift on main is STA-2036's, so their full `stackra gen --check` is
  green once STA-2036 lands (amendment 1).

## Success Criteria _(mandatory)_

- **SC-001**: The seed entry of a service with a factory-using demo seeder registers the factory pair — verified by:
  unit (`emit-runtime-entries.function.test.ts`) and the golden `service` snapshot.
- **SC-002**: Hosted seeders are listed from `<package>/testing`, before own seeders, in dependency order — verified
  by: unit (`emit-runtime-entries.function.test.ts`).
- **SC-003**: The wiring output of every golden fixture is byte-identical after the refactor — verified by: the golden
  runner.
- **SC-004**: `pnpm verify` is green for `@stackra/gen`, `@stackra/loyalty-kit` and `@stackra/access-log`, and
  `stackra gen --check` reports nothing stale — verified by: ci-box run.

## Out of scope

- The ADR 0190 seeder checks (a seeder not named `minimal`, `demo` or `test`; a `minimal` seeder importing a factory;
  unknown `ids`), the identity lock on seeder keys and a seeder's `static ids` through the generated client: STA-340,
  work package wp-69, which builds on the `seeders` section added here.
- Hosted factory pairs in the host's Vitest setup (a host test that seeds a hosted package's demo seeder). The setup
  keeps its own pairs; a follow-up can reuse the same rows.
- A seeder key collision between a hosted package and an own module of the same key (the STA-1666 case); the ledger
  check belongs with the seeder checks (wp-69).
- Running the golden service's seed entry against a database: the golden runner compares generated files, and
  `@stackra/database` already tests that a registered pair lets `Factory.create` find its model
  (`register-model-partners.function.test.ts`, `factory.base.test.ts`).

## Assumptions

- Package seeders and factories are exported from the package's `./testing` entry. The `Factory` base contract says
  "exported from `./testing` only, so a server never loads Faker", and `@stackra/loyalty-kit` exports its demo seeder
  and both factories from `./testing`. The seed entry imports them from there.
- A host depends on every package it hosts, so a package's seeders come before the host's own seeders. Package-to-package
  edges come from the package manifests' `modules[].dependsOn`, the same edges the wiring prints.
- Importing factories in the seed entry is safe for a `minimal` run: `@faker-js/faker` is an optional peer that the
  `FAKER` proxy loads only when a factory builds a row.
- Recording `seeders` here does not take wp-69's work: wp-69 adds the lock, the checks and the ids on this section, and
  depends on wp-25 in the path.

## Amendments

1. 2026-11-03 (build): a full regeneration of `@stackra/access-log`'s and `@stackra/loyalty-kit`'s committed
   manifests also rewrote drift already on main (version, permission rows, entity blocks), which STA-2036 owns. This
   change commits only the `seeders` and `factories` sections, as gen writes them; AC-005 and T012 now say so. EC-04
   now matches FR-008: the later import is aliased, which is the own class, since hosted rows come first.

## Status history

- 2026-11-03 · — → Draft · Claude (STA-2061 session) · created
