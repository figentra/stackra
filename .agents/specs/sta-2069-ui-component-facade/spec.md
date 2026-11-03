# Feature Specification: gen writes the `#stackra/ui` class-component facade

**Feature Branch**: `figentra/sta-2069-ui-component-facade`

**Created**: 2026-11-03

**Status**: Draft

**Tier**: feature

**Approver**: leader

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-2069

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: Work package wp-08 of the gen coverage path, closing gap G-203: the `#stackra/ui` class-component facade
is never written.

- ADR 0305 rule 37: a component is `class X extends Component<P>`, with `Component` imported from `#stackra/ui`.
- `packages/design-system/ui/src/react/component/component.ts` and `src/native/component/component.ts`: "an app
  reaches this base through its generated `#stackra/ui` facade".
- `packages/developer/gen/src/node/constants/component-module.constant.ts:11`: `COMPONENT_MODULE = "#stackra/ui"`,
  "the generated facade"; the class-components compiler (`class-components-plugin.function.ts:107-128`) removes that
  import, so a bundle works.
- `packages/developer/vite-plugin/src/core/functions/generated-modules-plugin.function.ts:46-50` resolves
  `#stackra/<name>` only to a file gen wrote under `.stackra/gen/`.
- No emitter writes `.stackra/gen/ui.ts` (`generate-member.function.ts` has no entry for it), so tsc cannot resolve
  the import and every class component fails typecheck.

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none. `apps/mobile` depends on `@stackra/ui` and gets the (gitignored) `.stackra/gen/ui.ts` the
  next time gen runs for it; nothing committed changes.
- **Services touched**: none
- **Packages touched**: `packages/developer/gen` (the new emitter, its wiring in `generateMember`, the
  `COMPONENT_MODULE` contract comment, the golden `app-clients` fixture, the README row)
- **Public contract change**: additive. A member that declares `@stackra/ui` gains the generated
  `.stackra/gen/ui.ts` (`#stackra/ui`), exporting `Component`. No manifest, action, event or export of a package
  changes.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none. The file is one type-level re-export; the class-components compiler removes the
  import before any bundle runs.
- **Secrets**: none
- **ADR needed**: no. ADR 0305 rule 37 already decides that `Component` comes from the generated `#stackra/ui`, and
  ADR 0261 that `#stackra/<name>` is a real file in `.stackra/gen/`.
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none. Class components get a resolvable base; nothing renders differently.
- **Docs to update**: `packages/developer/gen/README.md` (the `.` entry table and the generated-files table); no
  `apps/docs` page lists the generated files one by one.
- **Lane**: full
- **Change risk**: R1 (an additive generated file in gen only; no public contract of a package or service changes)

## Glossary _(full lane)_

- **Class component**: a `class X extends Component<P>` in a member's `.tsx` file, compiled by gen's
  `classComponents()` (Vite) or the Metro transformer to a function component (ADR 0305 rules 37 to 41).
- **Facade**: the generated `.stackra/gen/ui.ts`, imported as `#stackra/ui`, which re-exports the `Component` base
  from `@stackra/ui`.
- **Client entry**: `@stackra/ui/react` (web) or `@stackra/ui/native` (iOS and Android); each exports its own
  `Component<P>` with the same type-level shape.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A class component type-checks (Priority: P1)

An app author writes `class Greeting extends Component<GreetingProps>` with `import { Component } from
"#stackra/ui"`. The bundle already works, because the compiler removes the import. Today `tsc` fails with "cannot find
module `#stackra/ui`". After this change gen writes `.stackra/gen/ui.ts`, so the member's `#stackra/*` imports map
resolves it and the component type-checks.

**Why this priority**: it is the whole gap; every class component in every member fails typecheck without it.

**Independent Test**: emit the facade for an app IR whose packages include `@stackra/ui`; the file re-exports
`Component` from `@stackra/ui/react`. In the golden `app-clients` fixture, the web app declares `@stackra/ui`, ships a
class component, gets `.stackra/gen/ui.ts`, and `tsc --noEmit` over the generated app passes.

**Acceptance Scenarios**:

1. **Given** a web app that declares `@stackra/ui`, **When** gen runs, **Then** `.stackra/gen/ui.ts` holds
   `export { Component } from "@stackra/ui/react";` under the generated header.
2. **Given** an app whose only targets are iOS and Android, **When** gen runs, **Then** the facade re-exports from
   `@stackra/ui/native`.
3. **Given** a member that does not declare `@stackra/ui`, **When** gen runs, **Then** no `ui.ts` is written.

---

### Edge Cases

- **EC-01**: A member that does not declare `@stackra/ui` (in `dependencies` or `devDependencies`) gets no facade,
  since a re-export of an undeclared package would fail its typecheck and gen's `generated_dependency_missing` check.
- **EC-02**: An app with web and native targets gets the `@stackra/ui/react` facade; both entries export the same
  type-level `Component<P>` (abstract `props` and `render()`), and the compiler removes the import before either
  bundle loads it.
- **EC-03**: A package (no targets) that declares `@stackra/ui` gets the `@stackra/ui/react` facade.
- **EC-04**: An IR built by hand with no `packages` list gets no facade.
- **EC-05**: `stackra gen --check` on a member that has the facade reports nothing stale.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: WHEN a member declares `@stackra/ui` THE gen run SHALL write `.stackra/gen/ui.ts`, which re-exports
  `Component` from the member's client entry of `@stackra/ui`.
- **FR-002**: WHEN the member is an app whose client runtimes are native only THE facade SHALL re-export from
  `@stackra/ui/native`; otherwise from `@stackra/ui/react`.
- **FR-003**: IF a member does not declare `@stackra/ui` THEN THE gen run SHALL write no facade.
- **FR-004**: THE facade SHALL carry the standard generated header and export nothing but `Component`.

### Key Entities _(include if feature involves data)_

None.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a web app or package declares `@stackra/ui` THE emitter SHALL return a file that re-exports
  `Component` from `@stackra/ui/react`.
- **AC-002**: WHEN an app targets only iOS and Android THE emitter SHALL re-export from `@stackra/ui/native`.
- **AC-003**: IF the member does not declare `@stackra/ui` THEN THE emitter SHALL return nothing and gen SHALL write no
  `ui.ts`.
- **AC-004**: WHEN the golden `app-clients` web app declares `@stackra/ui` THE expected output SHALL hold
  `apps/web/.stackra/gen/ui.ts`.
- **AC-005**: WHEN the golden web app holds a class component that imports `Component` from `#stackra/ui` THE
  generated app SHALL pass `tsc --noEmit` (the import resolves).

## Success Criteria _(mandatory)_

- **SC-001**: The facade is emitted for exactly the members that declare `@stackra/ui`, with the right entry — verified
  by: unit (`emit-ui-facade.function.test.ts`).
- **SC-002**: The golden web app gets `.stackra/gen/ui.ts` — verified by: the golden runner snapshot.
- **SC-003**: A class component importing `#stackra/ui` type-checks in the generated golden app — verified by: manual
  ci-box run of `tsc --noEmit` over the golden cache of `apps/web`, recorded on the PR.
- **SC-004**: The gen package's gate (format, lint, typecheck, test, build) is green — verified by: ci-box run.

## Out of scope

- Two facades for one app (a `.native.ts` variant for an app with web and native targets): both entries share one
  type-level shape and the import never reaches a bundle, so one file serves both.
- Re-exporting anything beyond `Component` (props helpers, hooks): ADR 0305 rule 37 names `Component` only.
- Adding `@stackra/ui` to `apps/console` or another member: a dependency change touches `pnpm-lock.yaml`, owner only.
- The class-components compiler itself, already shipped.

## Assumptions

- A member that writes class components declares `@stackra/ui`, the package that owns `Component<P>` (both
  `component.ts` contracts say an app reaches the base through this facade). Gen already refuses a generated file that
  imports an undeclared `@stackra/*` package, so the dependency is the right trigger.
- Every member's imports map resolves `#stackra/*` to `.stackra/gen/*` (`scaffold.function.ts`, `apps/mobile`), so
  writing the file is enough for tsc.
- `clientRuntimes(ir)` is the source of truth for web versus native (ADR 0249, ADR 0295 decisions 7 and 8).

## Amendments

None.

## Status history

- 2026-11-03 · — → Draft · Claude (STA-2069 session) · created
