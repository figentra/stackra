# AGENTS — @stackra/infra-tools

<!--
Stackra file contract:
Purpose: the agent rules of @stackra/infra-tools: where code and images go, the catalogue and runway rules, pinned
         images, secrets, PII.
Boundary: documentation only; the code and ADR 0444 win on any difference.
Runtime: none
Governing contract: ADR 0444; ADR 0171; ADR 0173; owner decision R3-5 (2026-10-26).
-->

The per-region self-hosted tools stack (ADR 0444), as a Pulumi program part. Member at
`packages/infrastructure/infra-tools` (`tier:lib`). Entries `.` (the pure plan) and `./node` (the runway reader and
`awsToolsStack`).

## Where code goes

| You are writing…                       | It goes in…                                                            |
| -------------------------------------- | ---------------------------------------------------------------------- |
| A plan rule (pure, no Pulumi, no Node) | `src/core/functions/<name>.function.ts`                                |
| A plan type                            | `src/core/types/<name>.type.ts`                                        |
| Data (catalogue, extracts, schema)     | `src/core/constants/<name>.constant.ts`                                |
| Pulumi resources or a file reader      | `src/node/functions/<name>.function.ts`                                |
| A test                                 | `__tests__/<name>.<kind>.test.ts` beside it                            |
| An image Figentra builds               | `images/<tool>/` (Dockerfile, its tests in `images/<tool>/__tests__/`) |
| A GPU tool                             | a catalogue entry with `gpu: true` (and `instanceType`)                |

## Rules

- A new tool is a `TOOLS_CATALOGUE` entry; a new knob is a field of `providers.tools` in
  `TOOLS_RUNWAY_SCHEMA` with its default in the catalogue. Never branch on a region, market or product.
- Images are pinned to a tag at least two weeks old; record each in README "Pinned images". An image Figentra builds
  lives in `images/` and its catalogue tag is the one CI pushes; per-provider builds go in `providerImages`.
- Python lives only in `images/` (ADR 0492 decision 7; `pnpm validate` refuses a `.py` file elsewhere), behind a port in
  a TypeScript package; an image takes data in and returns numbers or text, with no business rule. A tool that is off by
  default says `enabled: false` in the catalogue. A `gpu: true` tool is placed on the GPU capacity provider, one GPU per
  task: say what the instance count costs in the commit.
- A database, extension or Valkey need is a catalogue field (`database`, `cache`), never code in the program.
- Never build an image, run Python or call a cloud on a workstation; CI builds, `pulumi up` is the owner's.
- `.` never imports `@pulumi/*` or `node:*`; endpoints stay computable without Pulumi.
- Secret names and parameter paths only, never a value (ADR 0173). No public address on any service.
- Test Pulumi code under `pulumi.runtime.setMocks` only; never `pulumi up` or a preview against a real account.

## PII

None here. The tools process personal data at run time (documents, addresses, conversations); that is the owning OS
services' concern and the region's residency (ADR 0353).
