# @stackra/renderers

The renderer layer that Stackra and Vellum share (ADR 0286 decision 6). It takes the neutral agent documents of
`@stackra/skills` (skills, rules, sub-agents, commands and hooks, each written once as Markdown with frontmatter)
and writes them into each assistant's own layout. It is pure: no file is read or written, and the same documents
always give the same bytes.

```ts
import { Assistant, renderAssistant } from "@stackra/renderers";
import { loadSkillSet } from "@stackra/skills/node";

const { files, skipped } = renderAssistant(Assistant.ClaudeCode, loadSkillSet(), {
  generator: "stackra agents setup",
});
// files: [{ path: "agents/reviewer.md", content: "---\nname: reviewer\n…" }, …], sorted by path
// skipped: documents the assistant has no form for, each with the reason
```

Paths are relative to the assistant's root. The caller picks the root: user level for `stackra agents setup`, the
project for `stackra agents sync` (ADR 0282 decision 10), or a Claude Code plugin folder. A skill's supporting files
beside its `SKILL.md` are the caller's to copy.

## Layouts

| Document              | Claude Code                | OpenCode                 | Kiro                     | Cursor               | `agents_md`          |
| --------------------- | -------------------------- | ------------------------ | ------------------------ | -------------------- | -------------------- |
| skill                 | `skills/<name>/SKILL.md`   | `skills/<name>/SKILL.md` | `skills/<name>/SKILL.md` | `rules/<name>.mdc`   | skipped              |
| rule, always on       | `rules/<name>.md`          | skipped (AGENTS.md)      | `steering/<name>.md`     | `rules/<name>.mdc`   | `AGENTS.md`, Always  |
| rule, file-scoped     | `rules/<name>.md`, `paths` | skipped (AGENTS.md)      | `steering/`, `fileMatch` | `rules/<name>.mdc`   | `AGENTS.md`, by glob |
| rule, read on request | `skills/<name>/SKILL.md`   | `skills/<name>/SKILL.md` | `steering/`, `manual`    | `rules/<name>.mdc`   | skipped              |
| sub-agent             | `agents/<name>.md`         | `agents/<name>.md`       | `agents/<name>.md`       | skipped              | skipped              |
| command               | `commands/<name>.md`       | `commands/<name>.md`     | skipped                  | `commands/<name>.md` | skipped              |
| hook                  | `hooks/hooks.json`         | skipped                  | skipped                  | skipped              | skipped              |

- A sub-agent's `tools` are Claude Code tool names. OpenCode has no tool grant, so each action the tools do not reach
  becomes a deny. Kiro maps them through its tool table, and a tool with no entry is refused (`RenderInputError`), so
  a new tool forces a decision instead of vanishing.
- `hooks/hooks.json` has the shape of the `hooks` key of a Claude Code settings file, grouped by event.
- Every Markdown file carries a provenance comment naming the generator and the document, never a path.
- Two documents that would write one path (a skill and a rule read on request with the same name) are refused.
- Claude Code and OpenCode are tested in the Vellum spike; Kiro and Cursor are kept and untested (ADR 0286 decision 16).

## API

| Export                                                             | What it is                                                             |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `Assistant`                                                        | `claude_code`, `opencode`, `kiro`, `cursor`, `agents_md`               |
| `renderAssistant(assistant, documents, opts?)`                     | the files and the skipped documents; `opts.generator` names who ran it |
| `RenderInputError`                                                 | an unknown assistant, a duplicate path, or an unmapped Kiro tool       |
| `RenderResult`, `RenderedFile`, `SkippedDocument`, `RenderOptions` | the types                                                              |

Governing ADRs: 0282 (decisions 2, 3, 9 and 10), 0286 (decisions 6 and 16), 0127 (developer category).
