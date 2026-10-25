---
"@stackra/gen": minor
---

The manifest follows ADR 0360 decision 4: a query, or an action a user can perform, is an MCP tool by default, and
`tool: false` on one needs a `// reason:` line (`tool_reason_missing`). Tool entries carry derived MCP `hints`;
actions carry their `effects` tags (`effect_unknown`); Integrations carry `roles` and `listing`
(`integration_role_unknown`); a `replaces` section lists every `@Replaces`. Exports `toolHints`, `EFFECT_TAGS`,
`INTEGRATION_ROLES` and `ToolHints`.
