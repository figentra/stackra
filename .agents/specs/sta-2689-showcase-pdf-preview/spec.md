# Feature Specification: showcase: commit PdfPreview's generated API docs with their Arabic catalogue

**Feature Branch**: `figentra/sta-2689-showcase-pdf-preview`

**Created**: 2026-11-10

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2689

**Clarifications status**: complete

**Input**: blocks the 0.33.0 cut. The Version Packages pull request #946 fails Validate's catalogue check:
`packages/design-system/showcase/assets/lang/ar/api.json` misses `free.pdf_preview.PdfPreview` `className`, `name`,
`onDownload` and `src`. The release flow's `changeset:version` runs `turbo run gen:workspace gen`, which regenerates
the showcase's API docs; PdfPreview's docs (`api/react/free/pdf-preview.json`, its `api/index.json` row and its
English catalogue entries) appear there for the first time, because main never regenerated them: the gate's
freshness check covers manifests and entities only. Gen writes the English catalogue, not the Arabic one, so the
Arabic file misses the four keys on the release branch only. The check behaves the same on both branches; main's
committed docs were stale.

### Sources

- #946's gate (Validate, catalogue check), run 42865993353
- `package.json` (`changeset:version`), the release branch's showcase diff

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/design-system/showcase (generated API docs and the Arabic catalogue);
  apps/mobile (one generated demo source file, `read-only.code.ts`, stale against its `.tsx`)
- **Public contract change**: none; the showcase documents PdfPreview, which already ships
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: the showcase's PdfPreview API page, in English and Arabic
- **Docs to update**: none
- **Lane**: full
- **Change risk**: R1 (generated docs and translations)

## Acceptance criteria

- **AC-001**: THE showcase's committed API docs SHALL equal what gen writes for PdfPreview on main.
- **AC-002**: THE Arabic API catalogue SHALL hold every PdfPreview key the English one does.
- **AC-003**: WHEN `turbo run gen:workspace gen --force` runs over main after a build THE tracked files SHALL not change.

## Status history

- 2026-11-10 → Clarified (the release flow's gen regenerates the showcase docs; main's were stale)
- 2026-11-10 → Planned (plan.md) — Approved by leader 2026-11-10
- 2026-11-10 → Tasked (tasks.md)
