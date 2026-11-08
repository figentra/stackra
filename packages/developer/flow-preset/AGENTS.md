# AGENTS — @stackra/flow-preset

Stackra's Figentra Flow preset (STA-2097; ADR 0503, ADR 0510 amendment of 2026-11-04). Member at
`packages/developer/flow-preset` (`tier:lib`). Data only: `preset/` is what `fflow sync` renders.

## Rules

- The layout is Flow's preset layout (Flow's README, "Presets"); add nothing Flow does not read.
- Guard tables (`preset/guard/*.mjs`) import only `node:*`, files of `preset/guard/`, `@figentra-oss/flow/guard` and
  `@figentra-oss/flow/guard/neutral`; never a relative path into Flow.
- `preset/preset.yml` `requires.flow` states the Flow range. Add the same range as `peerDependencies`
  `@figentra-oss/flow` once that Flow is published (pnpm installs a member's own peers), and keep the two equal.
- An `npx -y` MCP server in `preset/surfaces/mcp.yaml` is pinned to an exact version, never `@latest`.
- A third-party skill is listed by source in `preset/third-party.yml` and installed pinned, never vendored here
  (owner default O9); `preset/reference/encore/` is the one fenced upstream copy (ADR 0258).
- Every change ships a changeset; repositories adopt it with `fflow update`, never by editing rendered copies.
- Secrets: forbidden. A surface names a secret by `$NAME`, never a value.

## PII

| Data | Where | Handling                                                      |
| ---- | ----- | ------------------------------------------------------------- |
| none | —     | Preset content (Markdown, YAML, guard tables); it holds none. |
