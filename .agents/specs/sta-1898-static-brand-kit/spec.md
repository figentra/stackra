# Feature Specification: The static Worker serves the brand kit images

**Feature Branch**: `figentra/sta-1898-static-brand-kit`

**Created**: 2026-11-01

**Status**: Implementing

**Linear**: STA-1898

**Linear project**: none

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: Owner decision, 2026-11-01: "the released brand-kit images are served from the public static Worker (`workers/static`, ADR 0284); each repo's `.flow/readme.yml` points there. Nothing is committed into stackra (brand ADR 0001, pulled never copied): CI pulls the images from figentra/brand at pinned refs when it deploys the Worker."

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: none
- **Workers touched**: `workers/static` (pin file, build copy, `_headers` rule)
- **Public contract change**: new immutable paths `/brand/<kit>/<ref>/<path in the kit>`; existing paths unchanged
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: public brand images only; a read-only token for figentra/brand alone is minted for one step and revoked at job end
- **Secrets**: names only: org secrets `STACKRA_BOT_APP_ID`, `STACKRA_BOT_PRIVATE_KEY` (already in use by `linear-sync.yml`)
- **ADR needed**: no (dated note on ADR 0284)
- **New dependencies**: none (`yq` and `gh` are on the runner)
- **Deploy modes**: SaaS edge only, as ADR 0284
- **Licence tier**: not distributed
- **UI surfaces**: none
- **Docs to update**: `workers/static/README.md`, `workers/static/AGENTS.md`, `.github/workflows/README.md`, ADR 0284
- **Lane**: lite (recorded reason: one member and one workflow, scoped by the owner)
- **Change risk**: R2 (CI workflow with a new token; public static files)

## Requirements

- **FR-001**: `workers/static/brand-pins.yaml` lists each kit with a brand ref (a release tag, else a commit SHA) and the `include` globs served.
- **FR-002**: The deploy pulls those files from figentra/brand at the pinned refs into `workers/static/.brand/` before the build, with a token scoped to `brand`, `contents: read`, held by one step; a kit with no matching file fails the job.
- **FR-003**: The build copies `.brand/` to `dist/site/brand`, and `_headers` gives `/brand/*` an immutable `Cache-Control`.
- **FR-004**: No brand file is committed.

## Correctness properties

- **P-001**: `renderHeaders` emits exactly one immutable `/brand/*` rule beside the page and per-version rules, and counts it against the 100-rule cap — Validates: FR-003

## Edge cases

- **EC-01**: A local build has no `.brand/`; it serves no `/brand/` and does not fail.
- **EC-02**: A pin that is a branch would be cached for a year; pins are tags or SHAs only (AGENTS.md rule).
