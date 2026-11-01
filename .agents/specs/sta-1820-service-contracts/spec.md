# Specification: consumed services resolve from contract packages

**Feature Branch**: `figentra/sta-1820-service-contracts`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1820

**Clarifications status**: complete

**Input**: A member in one repository consumes a service built in another (an app in OS reading the commerce
service). Gen found the consumed service's `stackra.manifest.json` only beside the member, or by matching a
dependency's manifest `member` to the service key, which silently picked a wrong manifest (the `tenancy` package's
manifest for the `tenancy` service). Leader decision (option A): each producer release publishes
`@figentra/<service>-contract`, its `stackra.manifest.json`, `openapi.json` and lang catalogue with no source, whose
`package.json` carries `"stackra": { "kind": "contract" }`. A consumer adds it as a devDependency through the catalog.
Phase 1 is clients; cross-app event listeners follow a separate ADR and no transport is built here.

## Impact

- **Apps touched**: none (consumers pick it up on their next gen run)
- **Services touched**: none
- **Packages touched**: `packages/developer/gen` (read, resolve, clients, events), `packages/developer/skills`
  (`StackraKind.Contract` and the schema), `packages/developer/cli` (`stackra add` does not offer `contract`)
- **Cross-service events**: a listener of a remote service's event is refused (`client_event_remote_transport`) until
  the event-transport ADR; nothing is published or subscribed across apps
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: yes, an amendment of ADR 0453 decision 11 (a sixth kind, `contract`, installed by the consumer as a
  devDependency, never by `stackra add`); the event-transport ADR is a separate follow-up
- **New dependencies**: none
- **Deploy modes**: all, no change (a contract package is never hosted)
- **Licence tier**: free
- **Docs to update**: the ADR 0453 amendment; the gen README on where a consumed service is found
- **Lane**: full
- **Change risk**: R2 (a resolution rule narrows: a consumer that relied on the member-name fallback now needs the
  contract package or a sibling folder)

## Contract package: required fields

- `package.json`: `name` (any, by convention `@figentra/<service>-contract`), `version`, `files` listing the three
  artefacts, and `"stackra": { "kind": "contract" }`. No `tier`, `category`, `runtimes` or turbo tags, and no `src/`.
- `stackra.manifest.json` at the package root, whose `member` is the producer service (the match key). `openapi.json`
  and `assets/lang/` are optional; the lang is read when present.

## Requirements

- **FR-001** `StackraKind` has `contract`; `STACKRA_MANIFEST_SCHEMA` accepts `{ kind: "contract" }`; `stackra add` does
  not list it.
- **FR-002** `readServiceManifests` resolves a consumed service, when no sibling folder matches, from a declared
  dependency whose `package.json` has `stackra.kind` `contract` and whose manifest `member` equals the service (matched
  in snake or kebab case), by `dependencyPath`; the entry has no `folder` and carries `package`.
- **FR-003** `readDependencyManifests` never returns a `contract` package (it is not hosted).
- **FR-004** `serviceManifest` no longer matches a service against `ir.dependencies` by member name.
- **FR-005** The events target emits no sibling-path topic import for a service without a folder; a listener of such a
  service's event is refused with `client_event_remote_transport`. Clients still emit.
- **FR-006** `readServiceCatalogues` reads `assets/lang` from the contract package.
- **FR-007** `client_service_unknown`'s fix names both remedies: gen in the sibling service, or the contract package
  through the catalog.

## Out of scope

- A `stackra contract pack` command (release-side packing in each producer repo): follow-up.
- Cross-app event transport: a separate ADR.

## Status history

- 2026-11-01 → Clarified (leader decision, option A)
