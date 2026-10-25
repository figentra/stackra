# Implementation Plan: Runway v3 schemas and the v3 TypeScript role presets

**Spec**: `.agents/specs/sta-417-runway-v3-schemas/spec.md` · **Linear**: STA-417 · **Date**: 2026-10-24

## Summary

The three runway schemas move to version 3. The root gains a per-environment `topology` and the `docs` destination,
and loses the facts that moved into it. The member schemas lose `member`, take secret names as a list and gain
`requires`. `@stackra/typescript-config` turns on DOM and automatic JSX in `library` and adds five role presets as
exports of the same package. A dated Note on ADR 0300 records the preset change.

## Technical Context

- **Language**: JSON Schema draft 2020-12 (the schemas); JSONC tsconfig presets
- **Members**: `packages/tooling/typescript`, `apps/docs` (ADR note); repository files under `tools/schemas/`
- **Testing**: vitest in `packages/tooling/typescript/src/__tests__/presets.test.ts`; an ajv 8.20.0 run for the schemas
- **Storage**: none
- **Runtime target**: build time only (editors, `stackra validate`, `tsc`)

## Constitution Check

| Law                                   | Result | Note                                                                                       |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | a `tier:config` preset and data files under `tools/`; no import added                      |
| Secrets (ADR 0173)                    | PASS   | the schemas hold secret names only and refuse anything but a SCREAMING_SNAKE name          |
| Security                              | PASS   | no runtime code; every object is `additionalProperties: false` where the shape is known    |
| HTTP and events                       | N/A    | no action, endpoint or event                                                               |
| Tenancy                               | N/A    | no tenant data                                                                             |
| Delegation                            | PASS   | builder wrote it; a separate reviewer reviewed PR #136                                     |
| Not built yet (ADR 0227)              | PASS   | `requires.engine` admits only `postgres`, `valkey`, `s3`, `sns-sqs`; no new technology     |
| Test placement (ADR 0022)             | PASS   | `presets.test.ts` sits in `src/__tests__/`                                                 |
| Versions and catalogs                 | N/A    | no dependency change                                                                       |
| Tooling presets (ADR 0300)            | PASS   | still five tooling packages; the new presets are exports of `@stackra/typescript-config`   |
| Deploy modes (ADR 0076)               | PASS   | build-time files, identical in every mode                                                  |
| Licence tier (ADR 0077)               | PASS   | MIT package and MIT repository; no licence change                                          |
| Docs and ADRs                         | PASS   | dated Note on ADR 0300 and its index row, the preset README table, the schema descriptions |

## Deploy modes

| Mode       | Behaviour                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| SaaS       | build-time files; the static host also serves the schemas for editors                                         |
| On-prem    | identical; the presets and schemas are the same files                                                         |
| Air-gapped | identical; the schemas ship in the repository and the npm package, so no fetch from the static host is needed |

## Correctness properties

- **P-001**: The root schema accepts the template's root runway file and refuses `version` other than 3, a grouped `topology` without `groups`, an `instances` without `min` or `max`, an environment-level `isolate`, and a `defaults.service` key it dropped — Validates: FR-001, FR-002
- **P-002**: The member schemas accept the template's member runway files and refuse a `member` field, a secret that is not a name, a `requires.engine` outside the four, `dedicated: true` without `reason`, and a service environment with `deployable`, `isolate`, `resources`, `drivers` or a top-level `poolBudget` — Validates: FR-003, FR-004
- **P-003**: `library.json` sets `jsx` to `react-jsx`, and its `lib` contains `DOM` and `DOM.Iterable` — Validates: FR-005
- **P-004**: The package exports `./app`, `./mobile`, `./library`, `./service`, `./tooling`, `./desktop` and `./service-worker`, each pointing at a preset file inside `@stackra/typescript-config` — Validates: FR-006

## Contracts and events

The schema `$id`s are unchanged (`https://static.stackra.figentra.com/schemas/runway/{root,service,app}.json`). Their
content is the v3 shape, and a v2 runway file fails against them. No event.

## Data and tenancy

None.

## Delegation and risk plan

R2, lite lane by the lead's recorded choice (spec.md, Impact). One builder and a separate reviewer on PR #136. The
remaining work is running the preset tests, typecheck and build, and checking publication after the owner's tag.

## ADRs

None new. A dated Note on ADR 0300 (2026-10-24, STA-417). ADR 0296, 0299, 0237 and 0227 stand.

## Docs

`apps/docs/src/adr/0300-published-tooling-presets-and-enforced-spell-checking.mdx`, `apps/docs/src/adr/index.mdx`,
`packages/tooling/typescript/README.md`, `.changeset/typescript-config-v3-roles.md`, and the schema descriptions.

## Project structure

`tools/schemas/runway-{root,service,app}.schema.json`;
`packages/tooling/typescript/{package.json,README.md,src/{library,service,mobile,tooling,desktop,service-worker}.json,src/__tests__/presets.test.ts}`.
