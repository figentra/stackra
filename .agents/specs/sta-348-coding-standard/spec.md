# Feature Specification: `@stackra/coding-standard`, the house lint plugin

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348 (checks of STA-338 and STA-340)

**Linear project**: Developer tooling

**Clarifications status**: complete

**Input**: Build `@stackra/coding-standard` (developer, wave 3 in the registry, built in the wave-2 lane) for real:
the house rules as an oxlint plugin. The template imports nothing from it; its contract is the registry row and the
lint checks the accepted ADRs name.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/developer/coding-standard` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none (reads source text only)
- **Secrets**: none
- **ADR needed**: no (ADR 0129 decides the package; ADR 0127 2026-10-24 note places it in developer with entry `.`)
- **New dependencies**: none at runtime; dev dependencies from existing catalogs and `workspace:*` (`oxlint` from
  `catalog:quality` also provides the `RuleTester` the tests use)
- **Deploy modes**: not deployed; runs inside oxlint
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/developer/coding-standard/README.md`, `packages/developer/coding-standard/AGENTS.md`; ADR 0120, 0127, 0129, 0294, 0305 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R1 (developer tooling; no runtime path, no auth, tenancy, secrets or HTTP)
- **Branch members**: this branch (STA-348) also changes `packages/application/actions`, `packages/application/registry`, `packages/commerce/money`, `packages/commerce/pricing`, `packages/communication/versioning`, `packages/cross-cutting/seo`, `packages/data/assets`, `packages/data/filesystem`, `packages/data/model`, `packages/data/state-machine`, `packages/data/storage`, `packages/developer/cli`, `packages/developer/devtools-kit`, `packages/developer/gen`, `packages/developer/mcp`, `packages/developer/renderers`, `packages/developer/runway`, `packages/developer/skills`, `packages/developer/testing`, `packages/developer/vite-plugin`, `packages/experience/platform`, `packages/experience/shortcuts`, `packages/foundation/config`, `packages/foundation/container`, `packages/foundation/contracts`, `packages/foundation/errors`, `packages/foundation/events`, `packages/foundation/i18n`, `packages/foundation/logger`, `packages/foundation/support`, `packages/foundation/transport`, `packages/foundation/validation`, `packages/runtime/app`, `packages/runtime/cache`, `packages/runtime/devices`, `packages/runtime/realtime`, `packages/security/consent`, `packages/security/csp`, `packages/security/entitlements`, `packages/security/licensing`, `packages/state/coordinator`, `packages/state/feature-flags`, `packages/state/state`, `packages/state/theming`, `packages/tooling/oxlint`; spec-trace names every member of the diff, and each sibling package has its own `sta-348-*` spec or is outside this spec's scope

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry row: entry `.`, no workspace dependency; owner 2026-10-24: build the
  lint half now, tests run in a later workflow

## User Scenarios & Testing

### User Story 1 - The path and the class state one kind (Priority: P1)

An author writes `cancel-order.action.ts` with a class that extends `Query(...)`. Lint reports that an action file's
class extends `Action`.

**Independent Test**: `src/core/constants/__tests__/base-matches-suffix-rule.constant.test.ts`.

**Acceptance Scenarios**:

1. **Given** `src/modules/orders/actions/cancel-order.action.ts` exporting `class CancelOrderAction extends
Query({ key })`, **When** oxlint runs `stackra/base-matches-suffix`, **Then** it reports `wrongBase`.
2. **Given** `extends Policy<Order>`, `extends Model.with(...)`, `extends BaseAnalyticsConfig` or a sibling schema
   imported by a relative path, **When** the rule runs, **Then** nothing is reported.

### User Story 2 - Formatting autofixes match generated code (Priority: P1)

Lint inserts one blank line between class members and expands decorator and base-factory option objects to one
property per line, so authored and generated classes read the same way.

**Independent Test**: the `lines-between-class-members` and `multiline-decorator-options` rule tests.

### User Story 3 - Retired forms fail lint (Priority: P1)

`@Injectable()`, `@Action({ ... })`, `@Inject(X) param`, `@Trim()`, an `enum`, a `#private` member, a second exported
declaration and an empty `<key>.module.ts` are each reported with the ADR that retired them.

### User Story 4 - Conventions hold without review (Priority: P2)

Hook file names, member order, disable reasons and docblock shape are reported; the docblock rule collapses a
one-line block.

### Edge Cases

- A test file (`*.test.ts`) and a `.tsx` component carry no class kind and are ignored by `base-matches-suffix`.
- A trailing comment on a member's last line stays with that member when a blank line is inserted.
- An options object holding a comment is reported but never autofixed.
- `@Auditable()` is reported, never removed: dropping a facet would change behaviour.
- `@stackra/contracts`, `{@link X}` and `` `@Int` `` in a one-line docblock are not tags.

## Requirements

- **FR-001**: The package SHALL be `@stackra/coding-standard` at `packages/developer/coding-standard`, `tier:lib`,
  with the one entry `.` (registry row; ADR 0127 2026-10-24 note).
- **FR-002**: `.` SHALL export `STACKRA_PLUGIN` (and as the default export), an oxlint plugin named `stackra`.
- **FR-003**: The plugin SHALL register `base-matches-suffix`, `lines-between-class-members`,
  `multiline-decorator-options` and `no-empty-decorator` (STA-338 lint, ADR 0294 Enforcement); `no-kind-decorator`
  and `no-parameter-decorator` (STA-340 lint); `one-declaration-per-file` (ADR 0305 r13); `no-empty-module`
  (ADR 0305 r15); `no-enum`, `no-hash-private`, `hook-file-name`, `member-order` and `disable-needs-reason`
  (ADR 0129 d1); `docblock-shape` (owner R-11).
- **FR-004**: `lines-between-class-members`, `multiline-decorator-options` and `docblock-shape` SHALL autofix; no
  autofix SHALL drop a comment or remove behaviour.
- **FR-005**: Rules SHALL take no options and read only the file name and the syntax tree (no `node:*`, no file
  system).
- **FR-006**: The package SHALL have zero `dependencies`, zero `peerDependencies` and no workspace import; versions
  only through `catalog:` or `workspace:*`.
- **FR-007**: Every source file SHALL carry the Stackra file contract, one declaration per file and TSDoc on every
  export; tests SHALL sit in `__tests__/` and import the runner from `@stackra/testing`.

## Success Criteria

- **SC-001**: The template imports nothing from this package (registry row: none), so no template symbol is unmet.
- **SC-002**: Every registered rule has a `RuleTester` test with valid and invalid cases, and every helper function
  has a unit test (run in the separate testing workflow).
- **SC-003**: `oxfmt --check` and `oxlint` pass on the package.

## Assumptions

- Turning the rules on in `@stackra/oxlint-config` (and adding the disable comments the framework packages that
  implement kinds need) is the preset owner's follow-up, not this package's.
- The `stackra code:check` and `code:fix` commands of ADR 0129 d5 wait for `@stackra/cli` (wave 2 thin CLI).

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
