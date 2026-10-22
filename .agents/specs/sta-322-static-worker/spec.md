# Feature Specification: Hosted static files Worker at static.stackra.figentra.com

**Feature Branch**: `figentra/sta-322-static-worker`

**Created**: 2026-10-22

**Status**: Implementing

**Linear**: STA-322

**Linear project**: none

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: User description: "A small Cloudflare Worker that serves Stackra's hosted static files, starting with the JSON Schemas, from the monorepo, deployed with Wrangler from CI, with immutable versioned paths, a moving latest, CORS for everyone and a token from Infisical /ci over OIDC."

## Impact

- **Apps touched**: `apps/docs` (ADR 0284, ADR index, navigation)
- **Services touched**: none
- **Packages touched**: `packages/tooling/oxlint` (boundaries name `workers/`)
- **Workers touched**: new member `workers/static` (`@figentra/worker-static`, `tier:app`) in the new `workers/` root
- **Public contract change**: new public host `https://static.stackra.figentra.com/schemas/…` and `/schemas/index.json`
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: public files only; CORS `*`; the deploy token is read through OIDC and never stored in GitHub
- **Secrets**: names `CLOUDFLARE_API_TOKEN` (Infisical `prod` `/ci`); reads no value outside the deploy job
- **ADR needed**: yes, ADR 0284 (Accepted, owner decisions 2026-10-22)
- **New dependencies**: `wrangler` 4.148.0 in the new `deploy` catalog; `workerd` build allowed
- **Deploy modes**: SaaS edge only (Cloudflare); not part of on-prem or air-gapped installs
- **Licence tier**: not distributed (UNLICENSED member)
- **UI surfaces**: none
- **Docs to update**: ADR 0284, `workers/README.md`, `workers/static/README.md`, `.agents/rules/workspace-layout.md`, `.github/workflows/README.md`
- **Lane**: lite (recorded reason: one small static member plus one workflow, decided by the owner in chat)
- **Change risk**: R2 (new public host and a CI credential path; security and release review)

## User Scenarios & Testing

### User Story 1 - Editors resolve a schema by its `$id` (Priority: P1)

An editor or validator fetches `https://static.stackra.figentra.com/schemas/runway/app.json` from any origin and gets
the schema on `main`; a project that pins `/schemas/1.4.0/runway/app.json` always gets the same bytes.

**Independent Test**: the plan tests build a site from fixture schemas and releases and assert every path, every
rewritten `$id`, the index and the cache rules.

**Acceptance Scenarios**:

1. **Given** a schema with `$id` `…/schemas/runway/app.json`, **When** the site builds, **Then** it is served at that
   path and at `/schemas/latest/runway/app.json`.
2. **Given** tags `schemas@1.9.0` and `schemas@1.10.0`, **When** the site builds, **Then** both exact trees exist,
   are immutable, and `/schemas/v1/` holds 1.10.0.

### User Story 2 - CI deploys, and stays green without credentials (Priority: P2)

**Independent Test**: the workflow skips the deploy with a notice while `INFISICAL_CI_IDENTITY_ID` is empty.

**Acceptance Scenarios**:

1. **Given** no Infisical identity, **When** main changes the member, **Then** the job tests, builds and skips the
   deploy with a notice.

### Edge Cases

- **EC-01**: Before STA-305 lands there are no schemas; the site is a valid empty `/schemas/index.json`.
- **EC-02**: A `schemas@` tag that is not `x.y.z`, or a `$id` on another host or a reserved segment, fails the build.

## Requirements

- **FR-001**: THE builder SHALL publish each working-tree schema at its `$id` path and under `/schemas/latest/`, each
  release at `/schemas/<x.y.z>/`, and the newest release of each major at `/schemas/v<major>/`, each copy with `$id`
  set to its own URL.
- **FR-002**: THE builder SHALL emit `_headers` with `Access-Control-Allow-Origin: *` on every path and a one-year
  immutable Cache-Control on exact-version trees only, and SHALL fail past Cloudflare's 100-rule cap.
- **FR-003**: THE builder SHALL reject a schema whose `$id` is not `https://static.stackra.figentra.com/schemas/<name>.json`
  or uses a reserved segment, and a `schemas@` tag that is not `x.y.z`.
- **FR-004**: THE builder SHALL rebuild every release from its git tag on every build and SHALL fail rather than drop
  releases when git fails.
- **FR-005**: THE deploy workflow SHALL deploy only from `main` or a `schemas@*` tag on `main`, with the token from
  Infisical over OIDC, and SHALL skip with a notice while the identity variable is unset.

## Success Criteria

- **SC-001**: After the owner prerequisites exist, `https://static.stackra.figentra.com/schemas/index.json` answers 200
  with `Access-Control-Allow-Origin: *` — verified by: manual

## Out of scope

- The SchemaStore catalog entries for `runway.yaml`, `stackra.lock.yaml` and `.mcp.yaml` (an external PR once the host
  serves the schemas).
- Creating the Cloudflare token, the Infisical identity, the repository variable and the GitHub environment (owner).

## Assumptions

- Cloudflare Workers static assets applies `_headers` to asset responses and joins repeated headers with a comma
  (Cloudflare docs, Workers static assets, Headers).

## Status history

- 2026-10-22 · — → Draft · Claude (builder) · from STA-322 and the owner decisions of 2026-10-22 (lite lane)
- 2026-10-22 · Draft → Clarified · Claude (builder) · host, folder and naming settled by the owner
- 2026-10-22 · Clarified → Planned · Claude (builder)
- 2026-10-22 · Planned → Tasked · Claude (builder)
- 2026-10-22 · Tasked → Implementing · Claude (builder)
