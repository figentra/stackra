# Feature Specification: a TypeScript API reference generated from TSDoc, with the package index kept in sync

**Feature Branch**: `figentra/sta-2857-api-reference`

**Created**: 2026-11-26

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: lite

**Approver**: leader

**Linear**: STA-2857

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: Readiness item 12.4 ("docs a customer can follow"): customers had no symbol-level reference for the
`@stackra` packages, and the package index (`apps/docs/src/docs/customers/packages.mdx`) was a hand-kept snapshot whose
own note said a TSDoc reference was still missing. A newcomer could not look up what a package exports, and the index
could drift from the packages without anyone noticing.

### Sources

- `apps/docs/scripts/api-reference/` (the generator), `apps/docs/scripts/api-reference/__tests__/` (its tests)
- `apps/docs/src/docs/customers/packages.mdx` and `apps/docs/src/docs/customers/reference/*.mdx` (the generated pages)
- the root `package.json` (`validate`, `changeset:version`), `.github/workflows/runway-npm.yml` (the changesets bot's
  `version-script`)
- ADR 0007 (docblock standard), ADR 0514 (Fumadocs site), ADR 0025 (automation prepares the release)

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: apps/docs (`@figentra/docs`, private): the generator under `scripts/api-reference/`, the generated
  index and reference pages, a "Package reference" group in `src/config/docs.config.ts`, two scripts
  (`api-reference`, `api-reference:check`) and a dev dependency on `typescript6` (catalog `tooling`)
- **Services touched**: none
- **Packages touched**: none (the packages' sources and manifests are read, never changed)
- **Public contract change**: none. No exported type, contract, port or manifest of a published package changes; the
  new pages are documentation.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none; the pages print what the published packages already ship (declarations and TSDoc),
  `@internal` names and private members are left out
- **Secrets**: none
- **ADR needed**: no (follows ADR 0007 and ADR 0514)
- **New dependencies**: `typescript6` as a dev dependency of apps/docs, already in the `tooling` catalog and used by
  `@stackra/gen`
- **Deploy modes**: same in all three (static pages of the docs site)
- **Licence tier**: free (MIT, this repo; the docs site is public)
- **UI surfaces**: the docs site's "For customers" tab: the package index and the new "Package reference" group
- **Docs to update**: `apps/docs/README.md`, `apps/docs/AGENTS.md`; no changeset (apps/docs and the root are private)
- **Lane**: lite (new tooling and generated pages in a private app; no published contract)
- **Change risk**: R1 (`pnpm validate` and the release version step gain a step)

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE generator SHALL list every published package (`packages/<category>/<name>/package.json`, `private`
  ones left out) and read the exported names of each `exports` entry with one TypeScript program, without a build.
- **FR-002**: THE generator SHALL write `customers/packages.mdx` (name, version, summary, entry points, README and
  CHANGELOG links) and one page per package under `customers/reference/`, each name with its kind, declaring file,
  declaration (bodies, initializers, private and `#private` members removed) and TSDoc; `@internal` names are left out
  and a name declared by another package is listed as its re-export.
- **FR-003**: WHERE a package exports more than 500 names THE generator SHALL write one page per entry point besides
  `.` (`<name>--<entry>.mdx`).
- **FR-004**: WHEN run with `--check` THE generator SHALL write nothing and fail on a missing, changed or stale page;
  `pnpm validate` SHALL run it.
- **FR-005**: THE release version step (`changeset:version`, the changesets bot's `version-script`) SHALL regenerate the
  pages as its last step, so a version bump never leaves them stale.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a published package changes an export, its TSDoc or its `package.json` facts THE `--check` run SHALL
  fail until the pages are regenerated.
- **AC-002**: WHEN `pnpm changeset:version` bumps the versions THE `--check` run on its output SHALL pass.
- **AC-003**: THE generated pages SHALL render on the Fumadocs site (gen's page and MDX rules) and oxfmt SHALL leave
  their bytes alone.

## Success Criteria _(mandatory)_

- **SC-001**: `api-reference.test.ts`, `mdx-text.test.ts` and `parse-doc-comment.test.ts` prove FR-001 to FR-004 on a
  throwaway repository — verified by: unit
- **SC-002**: `release-version-step.test.ts` pins FR-005 and fails when the step is removed; a dry run of
  `pnpm changeset:version` on box 2 bumped 0.33.1 to 0.34.0 and `api-reference:check` then passed, while the same
  output without the regeneration failed on 127 pages — verified by: unit, manual
- **SC-003**: the apps/docs tests, oxlint and oxfmt pass, and `api-reference:check` passes on the branch — verified by:
  manual

## Out of scope

- TypeDoc or API Extractor output, a search index of symbols, per-version reference pages.
- Repointing the packages' `repository` URLs to the stackra-inc organization (the pages print what `package.json`
  says).

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-2857 session) · created from the branch's diff
- 2026-11-26 · Draft → Implementing · Claude (STA-2857 session) · the generator, the pages, the validate check and the release regeneration committed on the branch
