# SUBAGENT 07: Trim agents-sync.mjs to claude + opencode only

## Context

`tools/scripts/agents-sync.mjs` was copied from Basalt and supports five assistants:
claude, kiro, cline, cursor, opencode. Stackra decision (`.agents/plans/decisions.md`):
**claude + opencode only**.

Files:

- `tools/scripts/agents-sync.mjs` (1401 lines, 44 kiro/cline/cursor references)
- `tools/scripts/agents-sync.test.mjs` (576 lines, 29 kiro/cline/cursor references)

## Required changes

### agents-sync.mjs

1. **ASSISTANTS table** (~line 146–200): delete the `kiro`, `cline`, and `cursor` entries.
   Keep `claude` and `opencode` exactly as they are.

2. **Header doc comment** (lines 1–~140): remove mentions of `.kiro/`, `.clinerules/`,
   `.cursor/`, Kiro's `inclusion`/`fileMatchPattern`, Cursor's `alwaysApply`/`globs`,
   Cline's "no frontmatter", Kiro's `.kiro.hook` JSON, Kiro steering, `.mdc` extension,
   and any Kiro/Cursor/Cline dialect examples. Update the neutral rule frontmatter
   schema docs so they describe only what claude (no frontmatter output / rules as
   plain markdown) and opencode (AGENTS.md instructions block) need. Keep the
   provenance-comment explanation.

3. **Dialect/rendering functions**: find the functions that render per-assistant rule
   frontmatter and agent frontmatter (search for `kiro`, `cursor`, `cline` around
   lines 380–600 — e.g. `kiroAgentFrontmatter`, rule-frontmatter translators with
   `inclusion`/`fileMatchPattern`/`alwaysApply`/`globs` keys). Delete the branches
   for removed assistants; keep the claude and opencode branches intact.

4. **`selectAssistants()` error messages**: update the "known:" list — it prints
   `Object.keys(ASSISTANTS).join(", ")` so it self-updates, but check the hardcoded
   hint text (`pass --assistant=claude`) still makes sense.

5. Sweep the whole file: `grep -in "kiro\|cline\|cursor"` must return zero hits
   when done (including comments).

### agents-sync.test.mjs

6. Delete test cases that exercise kiro/cline/cursor behavior (steering dirs,
   `.mdc` rendering, `.clinerules` flat layout, `.kiro.hook` skipping, etc.).

7. Keep/adapt the claude and opencode tests. The known pre-existing failure from
   earlier work: line ~232 expects `#### Versions` but got `### Versions` —
   investigate and fix the expectation OR the renderer, whichever is wrong
   (check what claude rules output should look like: plain markdown, heading
   level as authored in the source rule file).

8. Sweep: `grep -in "kiro\|cline\|cursor"` must return zero hits in the test file too.

## Validation (must all pass)

```bash
cd /Users/akouta/Projects/final-project
node --test tools/scripts/agents-sync.test.mjs   # or: pnpm vitest run tools/scripts
node tools/scripts/agents-sync.mjs --list        # should show only claude + opencode entries
pnpm agents:check                                 # if this script exists in root package.json
grep -in "kiro\|cline\|cursor" tools/scripts/agents-sync.mjs tools/scripts/agents-sync.test.mjs
# ^ zero hits
```

## Rules

- Do NOT change behavior for claude or opencode.
- Do NOT touch `.agents/` source content.
- Keep the file's doc-comment style (dense, explains the _why_).
