# Feature Specification: `@stackra/runway` wave 2, runway v3 schemas and the runtime reader

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/runway` (developer, wave 2) for real: the runway format version 3 schemas of ADR 0296
(member WHAT, root WHERE) and the runtime reader the template's generated configs import.

## Impact

- **Apps touched**: none (the template's generated Vite, Playwright and Electron files consume it)
- **Services touched**: none
- **Packages touched**: `packages/developer/runway` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none. A runway holds secret names only; nothing here reads a secret value. `definesFor` inlines public
  vars only (`VITE_`, `EXPO_PUBLIC_`, `RENDERER_VITE_`)
- **ADR needed**: no (ADR 0296; ADR 0127 2026-10-24 note places runway in developer and sets the entries)
- **New dependencies**: none outside the catalogs (`zod` and `yaml` from the default catalog)
- **Deploy modes**: same in all; the readers read `.stackra/dev/ports.json` in dev and injected facts in a bundle
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/developer/runway/README.md`, `packages/developer/runway/AGENTS.md`; ADR 0120, 0127, 0227, 0296 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R2 (new public contract; no auth, tenancy, secrets or HTTP)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Owner, 2026-10-24: runway placed in `developer` by the ADR 0127 amendment; the
  extra `./ports` and `./vite` entries fold into standard entries

## User Scenarios & Testing

### User Story 1 - Generated configs read ports and origins from runway (Priority: P1)

The template's generated configs call `baseUrlOf("web")` (Playwright), `devPorts("console")` and
`updateFeed("console")` (Electron main) from `@stackra/runway`, and `devServer("console")` and
`definesFor("console", env)` (Vite) from `@stackra/runway/node`. No port, origin or feed URL is typed anywhere else.

**Independent Test**: `src/core/functions/__tests__/{base-url-of,dev-ports,update-feed,runway-facts}.function.test.ts`,
`src/node/functions/__tests__/{dev-server,defines-for}.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** `.stackra/dev/ports.json` above the working directory, **When** `baseUrlOf("web")` runs, **Then** it
   returns the web member's dev origin.
2. **Given** a bundle built with `define: definesFor("console", "production")`, **When** `updateFeed("console")` runs,
   **Then** it returns `<root feed.publicOrigin>/console/latest/` without reading a file; in dev it returns `null`.
3. **Given** a member runway with `ref:` and `${pr}` vars, **When** `definesFor` runs outside dev, **Then** each is read
   from the build environment and an unset one fails the build naming the variable.

### User Story 2 - `stackra validate` checks runway files (Priority: P1)

A runway file is checked against its kind's version 3 schema, and the root topology against the service members.

**Independent Test**: `src/core/functions/__tests__/{parse-runway,check-placement,runway-json-schema}.function.test.ts`,
`src/node/functions/__tests__/read-runway.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** the template's seven runway files, **When** each is read for its kind, **Then** it passes.
2. **Given** a member runway holding `member`, `deployable`, `isolate`, `group`, `cpu`, `memory` or `instances`, a
   dedicated resource without a reason, or an engine ADR 0227 defers, **Then** it fails naming the path.
3. **Given** a grouped environment that leaves a member unplaced or places it twice, **Then** `checkPlacement` reports
   it with the environment and a snake_case code.
4. **Given** a runway file with `$schema: "@stackra/runway/schema/<kind>.json"`, **Then** the package ships that file
   and it equals `runwayJsonSchema(kind)`.

## Requirements

- **FR-001**: Entries `.` and `./node` only, plus the asset paths `./schema/*.json` (ADR 0127 2026-10-24 note); one
  symbol per entry.
- **FR-002**: `.` exports `baseUrlOf`, `devPorts`, `updateFeed` (template), `parseRunway`, `checkPlacement`,
  `runwayJsonSchema`, the enums `RunwayKind`, `RunwayEnvironment`, `TopologyMode`, `RequirementEngine`,
  `CacheEviction`, the errors `RunwayInvalidError`, `RunwayUnresolvedError` and the document, facts and issue types.
- **FR-003**: `./node` exports `definesFor`, `devServer` (template) and `readRunway`.
- **FR-004**: Member schemas fix `version` at 3, have no `member` key and refuse every root key; the root schema holds
  the topology groups (mode, isolate, default, groups with members, cpu, memory, instances, scaling, workers).
- **FR-005**: `requires.<resource>.engine` accepts only `postgres` and `valkey`; `dedicated: true` needs a `reason`.
- **FR-006**: The `.` entry has no static Node import; it reaches the file system through `process.getBuiltinModule`
  only under Node.
- **FR-007**: The TLS paths of the dev facts never reach a bundle; no secret value is read anywhere.

## Success Criteria

- **SC-001**: Every symbol the template imports from `@stackra/runway` and `@stackra/runway/node` exists with the
  shape it uses; the template's runway files parse.
- **SC-002**: Every public symbol has a test in a `__tests__/` folder beside it.
- **SC-003**: `pnpm verify` green for the member (run in the separate testing workflow).

## Out of scope

- Writing `.stackra/dev/ports.json` and applying lane offsets: `stackra dev` (cli).
- Filling omitted gateway vars (`VITE_API_ORIGIN` in dev): gen.
- The gen check that every `requires` entry has a driver (STA-339).

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
