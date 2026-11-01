# Plan: hooks on mise-pinned oxlint and oxfmt (STA-1865)

1. `mise.toml`: add `"npm:oxlint" = "1.86.0"` and `"npm:oxfmt" = "0.71.0"` with a comment tying them to the catalog.
2. `lefthook.yml`: the oxfmt and oxlint steps run `mise exec -- <tool>`, falling back to `pnpm exec <tool>` when mise is
   missing.
3. `@stackra/repo-checks`: `checkToolPins(miseToml, workspaceYaml)` (pure) with its unit test; `configFindings` runs it
   as rule `tool-pins`; export it from `./node`; a patch changeset.
4. `mise install` of just the two tools on the Mac (approved), then commit with hooks on.
