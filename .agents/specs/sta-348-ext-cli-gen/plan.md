# Plan: extend cli, gen and mcp

1. gen: `EFFECT_TAGS`, `INTEGRATION_ROLES`, `toolHints`; `buildManifest` gains the v3 tool default and its reason
   check, effects and hints, Integration roles and listing, the `replaces` section; discovery reads the `// reason:`
   line above `tool: false` as `toolReason`.
2. mcp `.`: `toolTable`, `inlineSchemaRefs` (internal), `filterTools`, `protectedResourceMetadata`,
   `wwwAuthenticate`, with their types.
3. cli: seed-pack constants, types, `readSeedPack`, `seedRecordsFor`, `seedRecordHash`, `planSeed`, `findSeedPack`,
   `loadSeedRunner`, `SEED_PACK_COMMAND`; templates for package, service and seed pack, `workspaceRoot`,
   `NEW_COMMAND`.
4. Tests beside each subject; README, AGENTS and one changeset per package.

Owner mode: tests are written, not run.
