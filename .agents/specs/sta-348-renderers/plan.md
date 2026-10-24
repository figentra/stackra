# Plan: `@stackra/renderers` wave 2

**Spec**: `.agents/specs/sta-348-renderers/spec.md`

## Approach

- Port the assistant dialects of `@vellum/renderers` (Claude Code, Kiro and OpenCode frontmatter, the Kiro tool table,
  the OpenCode derived denies) and add Cursor and `AGENTS.md` (ADR 0282 decision 2). Leave Vellum's engine renderers
  in Vellum.
- Input is `AgentDocument` from `@stackra/skills` (already parsed and validated there), so this package re-parses
  nothing; its own frontmatter parser and `parseNeutralAgent` are not ported. Vellum's model tiers, permissions and
  skill references are not in the neutral format (sub-agents name no model), so they are not ported either.
- YAML is written with `yaml` (`lineWidth: 0`); Cursor's `globs` line is written by hand in Cursor's own unquoted form.
- One public function, `renderAssistant`, dispatches through a `Record<Assistant, …>` map, sorts by path and refuses
  duplicates. The per-assistant renderers, maps and Markdown helpers stay internal.

## Layout

```
packages/developer/renderers/
  package.json  tsconfig.json  turbo.jsonc  stackra.config.ts  tsdown.config.ts  vitest.config.ts
  README.md  AGENTS.md  CHANGELOG.md  LICENSE
  src/core/
    index.ts                              stand-in barrel for `.`
    enums/assistant.enum.ts
    errors/render-input.error.ts
    types/{rendered-file,skipped-document,render-result,render-options}.type.ts
    constants/{kiro-tools,opencode-actions,claude-hook-events}.constant.ts
    functions/render-assistant.function.ts
    functions/render-{claude-code,opencode,kiro,cursor,agents-md}.function.ts
    functions/{compose-markdown,provenance-comment,demote-headings}.function.ts
    **/__tests__/*.test.ts
```

## Risks

- The OpenCode agent `permissions` list follows the Vellum port (OpenCode's V2 agent docs), which the Vellum spike
  tests; Kiro and Cursor are untested (ADR 0286 decision 16).
- The input types come from `@stackra/skills`, built in the same wave; a change there must keep this package and Vellum
  working.
