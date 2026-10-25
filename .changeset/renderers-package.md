---
"@stackra/renderers": minor
---

Add `@stackra/renderers`, the renderer layer shared by Stackra and Vellum (ADR 0286): `renderAssistant(assistant,
documents, options?)` writes the neutral agent documents of `@stackra/skills` into the layout of Claude Code, OpenCode,
Kiro, Cursor or one `AGENTS.md`, as pure, path-sorted files with a provenance comment, and lists every document an
assistant has no form for with the reason; `Assistant` names the five layouts, and `RenderInputError` refuses an
unknown assistant, two documents on one path, or a sub-agent tool Kiro does not map.
