---
"@stackra/flow-preset": minor
---

New package: Stackra's Figentra Flow preset, moved out of Flow's bundled `presets/stackra` so Flow ships only
`neutral` (STA-2097, PLAN section 9 P2). A repository names it with `fflow preset add @stackra/flow-preset`; its
`preset.yml` requires Flow `^1.0.0`. The guard tables import Flow's public `@figentra-oss/flow/guard` entries, and the
`npx -y` MCP servers are pinned: `@heroui/react-mcp` 1.1.4, `@heroui/native-mcp` 1.1.4, `@playwright/mcp` 0.0.84.
