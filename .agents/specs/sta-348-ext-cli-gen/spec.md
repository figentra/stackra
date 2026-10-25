# Feature Specification: extend `@stackra/cli`, `@stackra/gen` and `@stackra/mcp` (wave 10)

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348 (rows of `stackra-package-needs.md`: cli, gen, mcp, "Seed packs from answers"); STA-344, STA-338
to STA-340

**Input**: the cli, gen and mcp rows of the package-needs table, under the owner principle "configuration, not code".

## Impact

- **Packages touched**: `packages/developer/cli`, `packages/developer/gen`, `packages/developer/mcp`
- **Apps, services, events, tables**: none

## Requirements

### cli

- **FR-1** `stackra new <package|service|seed-pack> <name>` writes a v3 member (`definePackage({})`,
  `defineService({ area })`, runway v3, no root module, `main.ts` or tool config) or a product seed pack skeleton.
- **FR-2** A seed pack `seed-pack:<product>` lives in `seed-packs/<product>/`, with `minimal`, `demo` and `test`
  profile folders (ADR 0190); every row cites the answer id it encodes; record kinds are the configuration model's.
- **FR-3** `stackra seed-pack <product> --check` refuses a pack with every issue; a run plans the profile against the
  member runner's state and writes only new and changed seed-owned records. A record a tenant changed is never
  overwritten (config-model sections 3 and 6).

### gen

- **FR-4** A query, or an action whose actors include a user, is an MCP tool by default; `tool: false` on such a class
  needs a `// reason:` line, else `tool_reason_missing` (ADR 0360 d4).
- **FR-5** `effects` tags from the closed set of ADR 0099 d2 (plus `bulk`, ADR 0360 d10) go to the manifest;
  `effect_unknown` otherwise. Tool hints are derived (ADR 0099 d3).
- **FR-6** An Integration's `roles` (ADR 0355 d1) and `listing` (ADR 0308 r21) go to its manifest entry;
  `integration_role_unknown` otherwise.
- **FR-7** Every `@Replaces` is listed in a `replaces` manifest section.

### mcp

- **FR-8** `toolTable(manifests)`: the hosted server's tools from committed manifests, input schemas inlined.
- **FR-9** `filterTools(tools, access)`: per caller and tenant; no permission drops, no entitlement locks.
- **FR-10** `protectedResourceMetadata` and `wwwAuthenticate`: RFC 9728 metadata naming the identity provider's issuer
  (ADR 0348 d2); every URL is host configuration.

## Not in this change

Gen's Expo target, rule outcome kinds beside fact sources, and the edition bundle and additions output; the
`@stackra/database` seed runner (`seedState`, `applySeed`); the `effects` option and the `tool: false` reason in
`@stackra/actions`'s option types. See tasks.md.
